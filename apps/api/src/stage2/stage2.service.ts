import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, Role } from "@prisma/client";
import { checkEligibility } from "../drives/eligibility";
import { PrismaService } from "../prisma/prisma.service";
import {
  buildRoadmap,
  calculateSkillProof,
  clampScore,
  extractSkillsFromText,
  levelFromScore,
  normalizeSkill,
  proofLevel,
  scoreGitHub,
  scoreHackerRank,
  scoreLeetCode,
  scoreProjectQuality,
  uniqueStrings,
  analyzeJobDescriptionText,
  analyzeResumeText
} from "./stage2.scoring";
import {
  HackerRankCsvDto,
  HackerRankManualDto,
  JobAnalyzeDto,
  LeetCodeManualDto,
  ResumeAnalyzeDto,
  RoadmapGenerateDto,
  UsernameSyncDto
} from "./dto/stage2.dto";

const json = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

type AuthLikeUser = {
  id: string;
  role: string;
};

type LeetCodeStats = {
  profileUrl: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking?: number;
  contestRating?: number;
  acceptanceRate?: number;
  badges: string[];
  topicStats: Record<string, number>;
};

type HackerRankStats = {
  profileUrl: string;
  problemSolvingScore: number;
  pythonScore: number;
  javaScore: number;
  sqlScore: number;
  certifications: string[];
  testScores: Array<Record<string, unknown>>;
};

@Injectable()
export class Stage2Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async syncGitHub(userId: string, dto: UsernameSyncDto) {
    if (!dto.consentAccepted) {
      throw new BadRequestException("Profile sync requires consent to analyze public coding activity");
    }

    const profile = await this.ensureStudentProfile(userId);
    const username = dto.username.trim();
    let analysis = await this.fetchGitHubProfile(username).catch((error: unknown) => {
      if (error instanceof BadRequestException) throw error;
      return this.mockGitHubProfile(username);
    });

    if (!analysis.repositories.length) {
      analysis = this.mockGitHubProfile(username);
    }

    const scored = scoreGitHub(analysis.repositories, analysis.profile);
    await this.prisma.studentProfile.update({ where: { id: profile.id }, data: { githubUsername: username } });

    const saved = await this.prisma.gitHubProfile.upsert({
      where: { studentProfileId: profile.id },
      create: {
        studentProfileId: profile.id,
        username,
        name: analysis.profile.name,
        bio: analysis.profile.bio,
        avatarUrl: analysis.profile.avatarUrl,
        profileUrl: analysis.profile.profileUrl,
        publicRepos: analysis.profile.publicRepos,
        followers: analysis.profile.followers,
        following: analysis.profile.following,
        githubScore: scored.score,
        strengthsJson: json(scored.strengths),
        weaknessesJson: json(scored.weaknesses),
        suggestionsJson: json(scored.suggestions),
        rawDataJson: json(analysis.rawData),
        lastSyncedAt: new Date(),
        repositories: {
          create: analysis.repositories.map((repo) => ({
            name: repo.name,
            description: repo.description,
            url: repo.url,
            primaryLanguage: repo.primaryLanguage,
            languagesJson: json(repo.languages ?? []),
            stars: repo.stars ?? 0,
            forks: repo.forks ?? 0,
            openIssues: repo.openIssues ?? 0,
            hasReadme: Boolean(repo.hasReadme),
            hasLiveDemo: Boolean(repo.hasLiveDemo),
            topicsJson: json(repo.topics ?? []),
            lastUpdatedAt: repo.lastUpdatedAt ? new Date(repo.lastUpdatedAt) : undefined,
            qualityScore: this.githubRepoQuality(repo)
          }))
        }
      },
      update: {
        username,
        name: analysis.profile.name,
        bio: analysis.profile.bio,
        avatarUrl: analysis.profile.avatarUrl,
        profileUrl: analysis.profile.profileUrl,
        publicRepos: analysis.profile.publicRepos,
        followers: analysis.profile.followers,
        following: analysis.profile.following,
        githubScore: scored.score,
        strengthsJson: json(scored.strengths),
        weaknessesJson: json(scored.weaknesses),
        suggestionsJson: json(scored.suggestions),
        rawDataJson: json(analysis.rawData),
        lastSyncedAt: new Date(),
        repositories: {
          deleteMany: {},
          create: analysis.repositories.map((repo) => ({
            name: repo.name,
            description: repo.description,
            url: repo.url,
            primaryLanguage: repo.primaryLanguage,
            languagesJson: json(repo.languages ?? []),
            stars: repo.stars ?? 0,
            forks: repo.forks ?? 0,
            openIssues: repo.openIssues ?? 0,
            hasReadme: Boolean(repo.hasReadme),
            hasLiveDemo: Boolean(repo.hasLiveDemo),
            topicsJson: json(repo.topics ?? []),
            lastUpdatedAt: repo.lastUpdatedAt ? new Date(repo.lastUpdatedAt) : undefined,
            qualityScore: this.githubRepoQuality(repo)
          }))
        }
      },
      include: { repositories: { orderBy: { qualityScore: "desc" } } }
    });

    await this.refreshSkillVerification(profile.id);
    await this.calculateSkillProofForProfile(profile.id);
    return saved;
  }

  async getGitHubMe(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    return this.prisma.gitHubProfile.findUnique({
      where: { studentProfileId: profile.id },
      include: { repositories: { orderBy: [{ qualityScore: "desc" }, { lastUpdatedAt: "desc" }] } }
    });
  }

  async getGitHubScore(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    const github = await this.prisma.gitHubProfile.findUnique({ where: { studentProfileId: profile.id } });
    return {
      score: github?.githubScore ?? 0,
      level: levelFromScore(github?.githubScore ?? 0),
      strengths: github?.strengthsJson ?? [],
      weaknesses: github?.weaknessesJson ?? [],
      suggestions: github?.suggestionsJson ?? []
    };
  }

  async syncLeetCode(userId: string, dto: UsernameSyncDto) {
    if (!dto.consentAccepted) {
      throw new BadRequestException("Profile sync requires consent to analyze public coding activity");
    }

    const profile = await this.ensureStudentProfile(userId);
    const username = dto.username.trim();
    const stats = await this.fetchLeetCodeProfile(username).catch(() => this.mockLeetCodeProfile(username));
    return this.persistLeetCode(profile.id, username, stats, "sync");
  }

  async saveLeetCodeManual(userId: string, dto: LeetCodeManualDto) {
    const profile = await this.ensureStudentProfile(userId);
    return this.persistLeetCode(
      profile.id,
      dto.username.trim(),
      {
        profileUrl: `https://leetcode.com/${dto.username.trim()}/`,
        totalSolved: dto.totalSolved ?? 0,
        easySolved: dto.easySolved ?? 0,
        mediumSolved: dto.mediumSolved ?? 0,
        hardSolved: dto.hardSolved ?? 0,
        ranking: dto.ranking,
        contestRating: dto.contestRating,
        acceptanceRate: dto.acceptanceRate,
        badges: dto.badges ?? [],
        topicStats: {}
      },
      "manual"
    );
  }

  async getLeetCodeMe(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    return this.prisma.leetCodeProfile.findUnique({ where: { studentProfileId: profile.id } });
  }

  async getLeetCodeScore(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    const leetcode = await this.prisma.leetCodeProfile.findUnique({ where: { studentProfileId: profile.id } });
    return {
      score: leetcode?.leetcodeScore ?? 0,
      level: levelFromScore(leetcode?.leetcodeScore ?? 0),
      strengths: leetcode?.strengthsJson ?? [],
      weaknesses: leetcode?.weaknessesJson ?? [],
      suggestions: leetcode?.suggestionsJson ?? []
    };
  }

  async syncHackerRank(userId: string, dto: UsernameSyncDto) {
    if (!dto.consentAccepted) {
      throw new BadRequestException("Profile sync requires consent to analyze public coding activity");
    }

    const profile = await this.ensureStudentProfile(userId);
    const username = dto.username.trim();
    return this.persistHackerRank(profile.id, username, this.mockHackerRankProfile(username), "sync-placeholder");
  }

  async saveHackerRankManual(userId: string, dto: HackerRankManualDto) {
    const profile = await this.ensureStudentProfile(userId);
    return this.persistHackerRank(
      profile.id,
      dto.username.trim(),
      {
        profileUrl: dto.profileUrl || `https://www.hackerrank.com/${dto.username.trim()}`,
        problemSolvingScore: dto.problemSolvingScore ?? 0,
        pythonScore: dto.pythonScore ?? 0,
        javaScore: dto.javaScore ?? 0,
        sqlScore: dto.sqlScore ?? 0,
        certifications: dto.certifications ?? [],
        testScores: dto.testScores ?? []
      },
      "manual"
    );
  }

  async uploadHackerRankCsv(dto: HackerRankCsvDto) {
    const rows = dto.rows?.length ? dto.rows : this.parseCsvRows(dto.csv ?? "");
    let matched = 0;
    for (const row of rows) {
      const username = String(row.username ?? row.hackerrankUsername ?? "").trim();
      if (!username) continue;
      const profile = await this.prisma.studentProfile.findFirst({
        where: { hackerrankUsername: { equals: username, mode: "insensitive" } }
      });
      if (!profile) continue;
      await this.persistHackerRank(
        profile.id,
        username,
        {
          profileUrl: String(row.profileUrl ?? `https://www.hackerrank.com/${username}`),
          problemSolvingScore: Number(row.problemSolvingScore ?? 0),
          pythonScore: Number(row.pythonScore ?? 0),
          javaScore: Number(row.javaScore ?? 0),
          sqlScore: Number(row.sqlScore ?? 0),
          certifications: String(row.certifications ?? "").split("|").filter(Boolean),
          testScores: [{ score: Number(row.testScore ?? 0), source: "tpo-csv" }]
        },
        "tpo-csv"
      );
      matched += 1;
    }

    return { rowsReceived: rows.length, matchedStudents: matched };
  }

  async getHackerRankMe(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    return this.prisma.hackerRankProfile.findUnique({ where: { studentProfileId: profile.id } });
  }

  async getHackerRankScore(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    const hackerRank = await this.prisma.hackerRankProfile.findUnique({ where: { studentProfileId: profile.id } });
    return {
      score: hackerRank?.hackerRankScore ?? 0,
      level: levelFromScore(hackerRank?.hackerRankScore ?? 0),
      strengths: hackerRank?.strengthsJson ?? [],
      weaknesses: hackerRank?.weaknessesJson ?? [],
      suggestions: hackerRank?.suggestionsJson ?? []
    };
  }

  async analyzeResume(userId: string, dto: ResumeAnalyzeDto) {
    const profile = await this.ensureStudentProfile(userId);
    const hydrated = await this.prisma.studentProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: { user: true, skills: true, projects: true, education: true }
    });

    if (dto.resumeUrl) {
      await this.prisma.studentProfile.update({ where: { id: profile.id }, data: { resumeUrl: dto.resumeUrl } });
    }

    const resumeText = dto.resumeText?.trim() || this.buildResumeTextFromProfile(hydrated, dto.resumeUrl);
    if (!resumeText.trim()) {
      throw new BadRequestException("Resume text is empty or unavailable");
    }

    const aiResult = await this.callAiService<Record<string, unknown>>("/analyze-resume", {
      resumeText,
      studentProfileData: hydrated
    });
    const local = analyzeResumeText(resumeText, hydrated.skills.map((skill) => skill.name));
    const result = {
      resumeScore: Number(aiResult?.resumeScore ?? local.resumeScore),
      atsScore: Number(aiResult?.atsScore ?? local.atsScore),
      detectedSkills: (aiResult?.detectedSkills as string[] | undefined) ?? local.detectedSkills,
      missingSections: (aiResult?.missingSections as string[] | undefined) ?? local.missingSections,
      weakPoints: (aiResult?.weakPoints as string[] | undefined) ?? local.weakPoints,
      suggestions: (aiResult?.suggestions as string[] | undefined) ?? local.suggestions,
      sectionScores: (aiResult?.sectionScores as Record<string, number> | undefined) ?? local.sectionScores
    };

    const saved = await this.prisma.resumeAnalysis.create({
      data: {
        studentProfileId: profile.id,
        resumeUrl: dto.resumeUrl ?? hydrated.resumeUrl,
        extractedText: resumeText,
        detectedSkillsJson: json(result.detectedSkills),
        missingSectionsJson: json(result.missingSections),
        weakPointsJson: json(result.weakPoints),
        suggestionsJson: json(result.suggestions),
        atsScore: clampScore(result.atsScore),
        resumeScore: clampScore(result.resumeScore),
        contactScore: clampScore(result.sectionScores.contactScore ?? 0),
        educationScore: clampScore(result.sectionScores.educationScore ?? 0),
        skillsScore: clampScore(result.sectionScores.skillsScore ?? 0),
        projectsScore: clampScore(result.sectionScores.projectsScore ?? 0),
        experienceScore: clampScore(result.sectionScores.experienceScore ?? 0),
        formattingScore: clampScore(result.sectionScores.formattingScore ?? 0),
        impactScore: clampScore(result.sectionScores.impactScore ?? 0),
        linksScore: clampScore(result.sectionScores.linksScore ?? 0)
      }
    });

    await this.refreshSkillVerification(profile.id);
    await this.calculateSkillProofForProfile(profile.id);
    return saved;
  }

  async latestResume(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    return this.prisma.resumeAnalysis.findFirst({
      where: { studentProfileId: profile.id },
      orderBy: { analyzedAt: "desc" }
    });
  }

  async resumeScore(userId: string) {
    const resume = await this.latestResume(userId);
    return {
      score: resume?.resumeScore ?? 0,
      atsScore: resume?.atsScore ?? 0,
      level: levelFromScore(resume?.resumeScore ?? 0),
      suggestions: resume?.suggestionsJson ?? []
    };
  }

  async extractSkills(text: string) {
    const analysis = analyzeJobDescriptionText(text);
    return {
      skills: analysis.extractedSkills,
      technologies: analysis.extractedSkills.filter((skill) => !["Communication", "Problem Solving", "Aptitude"].includes(skill)),
      softSkills: analysis.softSkills,
      roleCategory: analysis.roleCategory
    };
  }

  async analyzeJobDescription(driveId: string, dto: JobAnalyzeDto) {
    const drive = await this.prisma.drive.findUnique({ where: { id: driveId }, include: { company: true } });
    if (!drive) throw new NotFoundException("Company drive not found");

    const text = dto.jobDescription?.trim() || `${drive.company.name} ${drive.role}\n${drive.description}\nRequired: ${drive.requiredSkills.join(", ")}`;
    const aiResult = await this.callAiService<Record<string, unknown>>("/analyze-job-description", { jobDescription: text });
    const local = analyzeJobDescriptionText(text, drive.requiredSkills);
    const result = {
      extractedSkills: (aiResult?.requiredSkills as string[] | undefined) ?? local.extractedSkills,
      requiredSkills: (aiResult?.requiredSkills as string[] | undefined) ?? local.requiredSkills,
      preferredSkills: (aiResult?.preferredSkills as string[] | undefined) ?? local.preferredSkills,
      keywords: (aiResult?.keywords as string[] | undefined) ?? local.keywords,
      roleCategory: String(aiResult?.roleCategory ?? local.roleCategory),
      difficultyLevel: String(aiResult?.difficultyLevel ?? local.difficultyLevel)
    };

    return this.prisma.jobDescriptionAnalysis.upsert({
      where: { driveId },
      create: {
        driveId,
        extractedSkillsJson: json(result.extractedSkills),
        requiredSkillsJson: json(result.requiredSkills),
        preferredSkillsJson: json(result.preferredSkills),
        roleCategory: result.roleCategory,
        difficultyLevel: result.difficultyLevel,
        keywordsJson: json(result.keywords),
        analysisJson: json({ sourceText: text, ...result })
      },
      update: {
        extractedSkillsJson: json(result.extractedSkills),
        requiredSkillsJson: json(result.requiredSkills),
        preferredSkillsJson: json(result.preferredSkills),
        roleCategory: result.roleCategory,
        difficultyLevel: result.difficultyLevel,
        keywordsJson: json(result.keywords),
        analysisJson: json({ sourceText: text, ...result }),
        analyzedAt: new Date()
      }
    });
  }

  async getJobAnalysis(driveId: string) {
    const analysis = await this.prisma.jobDescriptionAnalysis.findUnique({ where: { driveId } });
    if (analysis) return analysis;
    return this.analyzeJobDescription(driveId, {});
  }

  async calculateSkillProofForUser(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    return this.calculateSkillProofForProfile(profile.id);
  }

  async skillProofMe(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    const latest = await this.prisma.skillProofScore.findFirst({
      where: { studentProfileId: profile.id },
      orderBy: { calculatedAt: "desc" }
    });
    return latest ?? this.calculateSkillProofForProfile(profile.id);
  }

  async skillProofHistory(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    return this.prisma.skillProofScore.findMany({
      where: { studentProfileId: profile.id },
      orderBy: { calculatedAt: "desc" },
      take: 12
    });
  }

  async skillVerification(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    const existing = await this.prisma.skillVerification.findMany({
      where: { studentProfileId: profile.id },
      orderBy: [{ confidenceScore: "desc" }, { skillName: "asc" }]
    });
    return existing.length ? existing : this.refreshSkillVerification(profile.id);
  }

  async matchDriveForUser(userId: string, driveId: string) {
    const profile = await this.ensureStudentProfile(userId);
    return this.calculateMatch(profile.id, driveId);
  }

  async getStudentMatches(studentProfileId: string) {
    return this.prisma.jobMatchResult.findMany({
      where: { studentProfileId },
      include: { drive: { include: { company: true } } },
      orderBy: { matchScore: "desc" }
    });
  }

  async recommendedStudents(driveId: string) {
    const drive = await this.prisma.drive.findUnique({ where: { id: driveId }, include: { company: true } });
    if (!drive) throw new NotFoundException("Company drive not found");

    const students = await this.prisma.studentProfile.findMany({
      include: { user: true, skills: true },
      orderBy: { readinessScore: "desc" },
      take: 50
    });

    const results = await Promise.all(students.map((student) => this.calculateMatch(student.id, driveId)));
    const byStudent = new Map(results.map((result) => [result.studentProfileId, result]));
    return {
      drive,
      students: students
        .map((student) => ({
          ...student,
          match: byStudent.get(student.id),
          eligibility: checkEligibility(student, drive)
        }))
        .sort((a, b) => (b.match?.matchScore ?? 0) - (a.match?.matchScore ?? 0))
    };
  }

  async generateRoadmap(userId: string, dto: RoadmapGenerateDto) {
    const profile = await this.ensureStudentProfile(userId);
    const drive = dto.driveId ? await this.prisma.drive.findUnique({ where: { id: dto.driveId }, include: { company: true } }) : null;
    if (dto.driveId && !drive) throw new NotFoundException("Company drive not found");

    const gaps = dto.driveId
      ? await this.prisma.skillGap.findMany({ where: { studentProfileId: profile.id, driveId: dto.driveId }, orderBy: { priority: "asc" } })
      : await this.prisma.skillVerification.findMany({ where: { studentProfileId: profile.id, proofLevel: { in: ["Weak Proof", "No Proof Found"] } } });

    const weakSkills = uniqueStrings(gaps.map((gap) => gap.skillName));
    const target = drive ? `${drive.company.name} ${drive.role}` : dto.targetRole || dto.goal || "placement readiness";
    const roadmap = buildRoadmap(dto.durationDays, target, weakSkills);
    const now = new Date();

    return this.prisma.studentRoadmap.create({
      data: {
        studentProfileId: profile.id,
        driveId: dto.driveId,
        title: roadmap.title,
        durationDays: dto.durationDays,
        goal: dto.goal || `Become ready for ${target}`,
        roadmapJson: json(roadmap),
        tasks: {
          create: roadmap.dailyTasks.map((task) => ({
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            dueDate: new Date(now.getTime() + task.day * 24 * 60 * 60 * 1000)
          }))
        }
      },
      include: { drive: { include: { company: true } }, tasks: { orderBy: { dueDate: "asc" } } }
    });
  }

  async myRoadmaps(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    return this.prisma.studentRoadmap.findMany({
      where: { studentProfileId: profile.id },
      include: { drive: { include: { company: true } }, tasks: { orderBy: { dueDate: "asc" } } },
      orderBy: { createdAt: "desc" }
    });
  }

  async getRoadmap(user: AuthLikeUser, id: string) {
    const roadmap = await this.prisma.studentRoadmap.findUnique({
      where: { id },
      include: { studentProfile: true, drive: { include: { company: true } }, tasks: { orderBy: { dueDate: "asc" } } }
    });
    if (!roadmap) throw new NotFoundException("Roadmap not found");
    await this.assertStudentResourceAccess(user, roadmap.studentProfileId);
    return roadmap;
  }

  async completeTask(user: AuthLikeUser, taskId: string, completed = true) {
    const task = await this.prisma.roadmapTask.findUnique({
      where: { id: taskId },
      include: { roadmap: true }
    });
    if (!task) throw new NotFoundException("Roadmap task not found");
    await this.assertStudentResourceAccess(user, task.roadmap.studentProfileId);
    return this.prisma.roadmapTask.update({ where: { id: taskId }, data: { completed } });
  }

  async tpoTopStudents() {
    const students = await this.prisma.studentProfile.findMany({
      include: {
        user: true,
        githubProfile: true,
        leetcodeProfile: true,
        hackerRankProfile: true,
        skills: true,
        resumeAnalyses: { orderBy: { analyzedAt: "desc" }, take: 1 },
        skillProofScores: { orderBy: { calculatedAt: "desc" }, take: 1 }
      },
      take: 50
    });

    return students
      .map((student) => ({
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        branch: student.branch,
        cgpa: student.cgpa,
        readinessScore: student.readinessScore,
        skillProofScore: student.skillProofScores[0]?.overallScore ?? 0,
        githubScore: student.githubProfile?.githubScore ?? 0,
        leetcodeScore: student.leetcodeProfile?.leetcodeScore ?? 0,
        resumeScore: student.resumeAnalyses[0]?.resumeScore ?? 0,
        recommendedRoles: this.recommendedRolesForStudent(student.skills?.map((skill) => skill.name) ?? [])
      }))
      .sort((a, b) => b.skillProofScore - a.skillProofScore || b.readinessScore - a.readinessScore)
      .slice(0, 25);
  }

  async tpoSkillGapReport() {
    const [gaps, students] = await Promise.all([
      this.prisma.skillGap.findMany({ include: { drive: { include: { company: true } }, studentProfile: { include: { user: true } } } }),
      this.prisma.studentProfile.findMany({ include: { skills: true } })
    ]);

    const missing = this.countBy(gaps.map((gap) => gap.skillName));
    const branchWise = students.reduce<Record<string, Record<string, number>>>((acc, student) => {
      const branch = student.branch || "Not added";
      acc[branch] ??= {};
      for (const skill of student.skills) {
        if (skill.level <= 2) acc[branch][skill.name] = (acc[branch][skill.name] ?? 0) + 1;
      }
      return acc;
    }, {});

    return {
      mostMissingSkills: missing,
      branchWiseWeakAreas: Object.entries(branchWise).map(([branch, skills]) => ({ branch, skills: this.countMapToList(skills) })),
      companyWiseGaps: gaps.map((gap) => ({
        company: gap.drive.company.name,
        role: gap.drive.role,
        student: gap.studentProfile.user.name,
        skill: gap.skillName,
        priority: gap.priority,
        recommendation: gap.recommendation
      })),
      suggestedTrainingSessions: missing.slice(0, 6).map((item) => `Run a ${item.name} workshop for ${item.count} students`)
    };
  }

  async tpoCompanyFitReport(driveId: string) {
    return this.recommendedStudents(driveId);
  }

  async tpoWeakSkillsReport() {
    const verifications = await this.prisma.skillVerification.findMany({
      where: { proofLevel: { in: ["Weak Proof", "No Proof Found"] } },
      include: { studentProfile: { include: { user: true } } }
    });
    return {
      weakSkills: this.countBy(verifications.map((item) => item.skillName)),
      students: verifications.map((item) => ({
        student: item.studentProfile.user.name,
        skill: item.skillName,
        proofLevel: item.proofLevel,
        suggestion: item.suggestion
      }))
    };
  }

  async tpoPlatformReadiness() {
    const [students, skillProofAggregate] = await Promise.all([
      this.prisma.studentProfile.findMany({
        include: {
          githubProfile: true,
          leetcodeProfile: true,
          hackerRankProfile: true,
          resumeAnalyses: { orderBy: { analyzedAt: "desc" }, take: 1 },
          skillProofScores: { orderBy: { calculatedAt: "desc" }, take: 1 }
        }
      }),
      this.prisma.skillProofScore.aggregate({ _avg: { overallScore: true } })
    ]);

    const average = (values: number[]) => clampScore(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));
    return {
      averageSkillProofScore: clampScore(skillProofAggregate._avg.overallScore ?? 0),
      averageGithubScore: average(students.map((student) => student.githubProfile?.githubScore ?? 0)),
      averageLeetCodeScore: average(students.map((student) => student.leetcodeProfile?.leetcodeScore ?? 0)),
      averageHackerRankScore: average(students.map((student) => student.hackerRankProfile?.hackerRankScore ?? 0)),
      averageResumeScore: average(students.map((student) => student.resumeAnalyses[0]?.resumeScore ?? 0)),
      connectedProfiles: {
        github: students.filter((student) => student.githubProfile).length,
        leetcode: students.filter((student) => student.leetcodeProfile).length,
        hackerrank: students.filter((student) => student.hackerRankProfile).length,
        resumeAnalyzed: students.filter((student) => student.resumeAnalyses.length).length
      }
    };
  }

  async calculateSkillProofForProfile(studentProfileId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        projects: true,
        githubProfile: true,
        leetcodeProfile: true,
        hackerRankProfile: true,
        resumeAnalyses: { orderBy: { analyzedAt: "desc" }, take: 1 },
        skillVerifications: true
      }
    });
    if (!profile) throw new NotFoundException("Student profile not found");

    const verificationScore = profile.skillVerifications.length
      ? clampScore(profile.skillVerifications.reduce((sum, item) => sum + item.confidenceScore, 0) / profile.skillVerifications.length)
      : 0;
    const result = calculateSkillProof({
      placementReadinessScore: profile.readinessScore,
      resumeScore: profile.resumeAnalyses[0]?.resumeScore ?? 0,
      githubScore: profile.githubProfile?.githubScore ?? 0,
      leetcodeScore: profile.leetcodeProfile?.leetcodeScore ?? 0,
      hackerRankScore: profile.hackerRankProfile?.hackerRankScore ?? 0,
      projectScore: scoreProjectQuality(profile.projects),
      skillVerificationScore: verificationScore
    });

    return this.prisma.skillProofScore.create({
      data: {
        studentProfileId,
        overallScore: result.overallScore,
        level: result.level,
        placementReadinessScore: result.breakdown.placementReadinessScore,
        resumeScore: result.breakdown.resumeScore,
        githubScore: result.breakdown.githubScore,
        leetcodeScore: result.breakdown.leetcodeScore,
        hackerRankScore: result.breakdown.hackerRankScore,
        projectScore: result.breakdown.projectScore,
        skillVerificationScore: result.breakdown.skillVerificationScore,
        breakdownJson: json(result.breakdown),
        suggestionsJson: json(result.suggestions)
      }
    });
  }

  private async calculateMatch(studentProfileId: string, driveId: string) {
    const [student, drive] = await Promise.all([
      this.prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        include: {
          user: true,
          skills: true,
          projects: true,
          githubProfile: { include: { repositories: true } },
          leetcodeProfile: true,
          hackerRankProfile: true,
          resumeAnalyses: { orderBy: { analyzedAt: "desc" }, take: 1 },
          skillVerifications: true
        }
      }),
      this.prisma.drive.findUnique({ where: { id: driveId }, include: { company: true, jobDescriptionAnalysis: true } })
    ]);
    if (!student || !drive) throw new NotFoundException("Student or drive not found");

    const jdRequired = Array.isArray(drive.jobDescriptionAnalysis?.requiredSkillsJson)
      ? (drive.jobDescriptionAnalysis?.requiredSkillsJson as string[])
      : [];
    const requiredSkills = uniqueStrings([...drive.requiredSkills, ...jdRequired]);
    const resumeSkills = Array.isArray(student.resumeAnalyses[0]?.detectedSkillsJson)
      ? (student.resumeAnalyses[0]?.detectedSkillsJson as string[])
      : [];
    const githubSkills = uniqueStrings(
      student.githubProfile?.repositories.flatMap((repo) => [
        repo.primaryLanguage,
        ...(Array.isArray(repo.languagesJson) ? (repo.languagesJson as string[]) : [])
      ]) ?? []
    );
    const projectSkills = uniqueStrings(student.projects.flatMap((project) => project.techStack));
    const studentSkills = uniqueStrings([
      ...student.skills.map((skill) => skill.name),
      ...resumeSkills,
      ...githubSkills,
      ...projectSkills
    ]);
    const studentSkillSet = new Set(studentSkills.map(normalizeSkill));
    const matchedSkills = requiredSkills.filter((skill) => studentSkillSet.has(normalizeSkill(skill)));
    const missingSkills = requiredSkills.filter((skill) => !studentSkillSet.has(normalizeSkill(skill)));
    const weakSkills = student.skillVerifications
      .filter((item) => requiredSkills.some((skill) => normalizeSkill(skill) === normalizeSkill(item.skillName)) && item.confidenceScore < 60)
      .map((item) => item.skillName);
    const strongProofSkills = student.skillVerifications
      .filter((item) => requiredSkills.some((skill) => normalizeSkill(skill) === normalizeSkill(item.skillName)) && item.confidenceScore >= 75)
      .map((item) => item.skillName);
    const eligibility = checkEligibility(student, drive);
    const requiredMatch = requiredSkills.length ? (matchedSkills.length / requiredSkills.length) * 100 : 75;
    const projectRelevance = requiredSkills.length
      ? (projectSkills.filter((skill) => requiredSkills.some((required) => normalizeSkill(required) === normalizeSkill(skill))).length / requiredSkills.length) * 100
      : scoreProjectQuality(student.projects);
    const codingStrength = clampScore(((student.leetcodeProfile?.leetcodeScore ?? 0) + (student.hackerRankProfile?.hackerRankScore ?? 0)) / 2);
    const academic = eligibility.status === "ELIGIBLE" ? 100 : eligibility.status === "PARTIALLY_READY" ? 65 : 20;
    const proofQuality = strongProofSkills.length ? Math.min(100, strongProofSkills.length * 25) : 35;
    const matchScore = clampScore(requiredMatch * 0.35 + projectRelevance * 0.2 + (student.resumeAnalyses[0]?.atsScore ?? 0) * 0.15 + codingStrength * 0.15 + academic * 0.1 + proofQuality * 0.05);
    const reasons = [
      `${matchedSkills.length}/${requiredSkills.length || 1} required skills matched`,
      eligibility.reason,
      matchScore >= 75 ? "Student is a strong fit for this drive" : "Student needs targeted improvement before applying"
    ];
    const suggestions = [
      ...missingSkills.map((skill) => `Build proof for ${skill}`),
      ...(weakSkills.length ? [`Strengthen proof for weak skills: ${weakSkills.join(", ")}`] : []),
      "Generate a roadmap before applying if fit is below 80%"
    ];

    await this.prisma.skillGap.deleteMany({ where: { studentProfileId, driveId } });
    if (missingSkills.length || weakSkills.length) {
      await this.prisma.skillGap.createMany({
        data: uniqueStrings([...missingSkills, ...weakSkills]).map((skill) => ({
          studentProfileId,
          driveId,
          skillName: skill,
          gapType: missingSkills.some((missing) => normalizeSkill(missing) === normalizeSkill(skill)) ? "MISSING" : "WEAK",
          priority: requiredSkills.some((required) => normalizeSkill(required) === normalizeSkill(skill)) ? "HIGH" : "MEDIUM",
          recommendation: `Complete focused practice and add project proof for ${skill}`
        }))
      });
    }

    return this.prisma.jobMatchResult.upsert({
      where: { studentProfileId_driveId: { studentProfileId, driveId } },
      create: {
        studentProfileId,
        driveId,
        matchScore,
        matchedSkillsJson: json(matchedSkills),
        missingSkillsJson: json(missingSkills),
        weakSkillsJson: json(weakSkills),
        strongProofSkillsJson: json(strongProofSkills),
        reasonsJson: json(reasons),
        suggestionsJson: json(suggestions)
      },
      update: {
        matchScore,
        matchedSkillsJson: json(matchedSkills),
        missingSkillsJson: json(missingSkills),
        weakSkillsJson: json(weakSkills),
        strongProofSkillsJson: json(strongProofSkills),
        reasonsJson: json(reasons),
        suggestionsJson: json(suggestions),
        calculatedAt: new Date()
      },
      include: { drive: { include: { company: true } }, studentProfile: { include: { user: true } } }
    });
  }

  private async refreshSkillVerification(studentProfileId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        skills: true,
        projects: true,
        githubProfile: { include: { repositories: true } },
        leetcodeProfile: true,
        hackerRankProfile: true,
        resumeAnalyses: { orderBy: { analyzedAt: "desc" }, take: 1 }
      }
    });
    if (!profile) throw new NotFoundException("Student profile not found");

    const resumeSkills = Array.isArray(profile.resumeAnalyses[0]?.detectedSkillsJson)
      ? (profile.resumeAnalyses[0]?.detectedSkillsJson as string[])
      : [];
    const allSkills = uniqueStrings([...profile.skills.map((skill) => skill.name), ...resumeSkills, ...profile.projects.flatMap((project) => project.techStack)]);
    const githubRepoSkills = uniqueStrings(profile.githubProfile?.repositories.flatMap((repo) => [repo.primaryLanguage, ...(Array.isArray(repo.languagesJson) ? (repo.languagesJson as string[]) : [])]) ?? []);
    const projectSkills = uniqueStrings(profile.projects.flatMap((project) => project.techStack));

    const saved = [];
    for (const skill of allSkills) {
      const normalized = normalizeSkill(skill);
      const sources = {
        resume: resumeSkills.some((value) => normalizeSkill(value) === normalized),
        project: projectSkills.some((value) => normalizeSkill(value) === normalized),
        github: githubRepoSkills.some((value) => normalizeSkill(value) === normalized),
        leetcode: ["dsa", "data structures", "algorithms", "dynamic programming", "graphs", "trees"].includes(normalized) && (profile.leetcodeProfile?.leetcodeScore ?? 0) >= 60,
        hackerrank: ["sql", "java", "python", "problem solving"].includes(normalized) && (profile.hackerRankProfile?.hackerRankScore ?? 0) >= 60
      };
      const confidenceScore = clampScore(
        (sources.resume ? 20 : 0) +
          (sources.project ? 30 : 0) +
          (sources.github ? 30 : 0) +
          (sources.leetcode ? 10 : 0) +
          (sources.hackerrank ? 10 : 0)
      );
      saved.push(await this.prisma.skillVerification.upsert({
        where: { studentProfileId_skillName: { studentProfileId, skillName: skill } },
        create: {
          studentProfileId,
          skillName: skill,
          proofLevel: proofLevel(confidenceScore),
          confidenceScore,
          sourcesJson: json(sources),
          suggestion: confidenceScore >= 80 ? "Strong verified signal" : `Add stronger public proof for ${skill}`
        },
        update: {
          proofLevel: proofLevel(confidenceScore),
          confidenceScore,
          sourcesJson: json(sources),
          suggestion: confidenceScore >= 80 ? "Strong verified signal" : `Add stronger public proof for ${skill}`
        }
      }));
    }
    return saved;
  }

  private async ensureStudentProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true }
    });
    if (!user) throw new NotFoundException("User not found");
    if (user.role !== Role.STUDENT) throw new ForbiddenException("Only student accounts can access this resource");
    if (user.studentProfile) return user.studentProfile;
    return this.prisma.studentProfile.create({ data: { userId, collegeName: "" } });
  }

  private async assertStudentResourceAccess(user: AuthLikeUser, studentProfileId: string) {
    if (user.role === Role.TPO_ADMIN || user.role === Role.SUPER_ADMIN) return;
    const profile = await this.ensureStudentProfile(user.id);
    if (profile.id !== studentProfileId) throw new ForbiddenException("You cannot access another student's SkillProof data");
  }

  private async callAiService<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
    const baseUrl = this.config.get<string>("AI_SERVICE_URL");
    if (!baseUrl) return null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) return null;
      return await response.json() as T;
    } catch {
      return null;
    }
  }

  private async fetchGitHubProfile(username: string) {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "PlaceMate-AI-Stage2"
    };
    const token = this.config.get<string>("GITHUB_TOKEN");
    if (token) headers.Authorization = `Bearer ${token}`;

    const userResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
    if (userResponse.status === 404) throw new BadRequestException("Invalid GitHub username");
    if (!userResponse.ok) throw new Error("GitHub API unavailable");
    const user = await userResponse.json() as Record<string, unknown>;

    const reposResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=12`, { headers });
    if (!reposResponse.ok) throw new Error("GitHub repositories unavailable");
    const repos = await reposResponse.json() as Array<Record<string, unknown>>;
    const repositories = await Promise.all(repos.map(async (repo) => {
      const fullName = String(repo.full_name ?? "");
      const [readmeResponse, languagesResponse] = await Promise.all([
        fullName ? fetch(`https://api.github.com/repos/${fullName}/readme`, { headers }).catch(() => null) : Promise.resolve(null),
        fullName ? fetch(`https://api.github.com/repos/${fullName}/languages`, { headers }).catch(() => null) : Promise.resolve(null)
      ]);
      const languages = languagesResponse?.ok ? Object.keys(await languagesResponse.json() as Record<string, number>) : [];
      return {
        name: String(repo.name ?? ""),
        description: repo.description ? String(repo.description) : null,
        url: String(repo.html_url ?? ""),
        primaryLanguage: repo.language ? String(repo.language) : null,
        languages,
        stars: Number(repo.stargazers_count ?? 0),
        forks: Number(repo.forks_count ?? 0),
        openIssues: Number(repo.open_issues_count ?? 0),
        hasReadme: Boolean(readmeResponse?.ok),
        hasLiveDemo: Boolean(repo.homepage),
        topics: Array.isArray(repo.topics) ? repo.topics.map(String) : [],
        lastUpdatedAt: repo.pushed_at ? String(repo.pushed_at) : null
      };
    }));

    return {
      profile: {
        username,
        name: user.name ? String(user.name) : null,
        bio: user.bio ? String(user.bio) : null,
        avatarUrl: user.avatar_url ? String(user.avatar_url) : null,
        profileUrl: user.html_url ? String(user.html_url) : `https://github.com/${username}`,
        publicRepos: Number(user.public_repos ?? repositories.length),
        followers: Number(user.followers ?? 0),
        following: Number(user.following ?? 0)
      },
      repositories,
      rawData: { source: "github-api", user, repositories }
    };
  }

  private mockGitHubProfile(username: string) {
    const seed = username.length;
    const repositories = [
      {
        name: `${username}-placement-tracker`,
        description: "Full-stack placement tracker with dashboards and analytics.",
        url: `https://github.com/${username}/placement-tracker`,
        primaryLanguage: "TypeScript",
        languages: ["TypeScript", "React", "SQL"],
        stars: seed % 4,
        forks: seed % 3,
        openIssues: 1,
        hasReadme: true,
        hasLiveDemo: seed % 2 === 0,
        topics: ["nextjs", "nestjs", "placement"],
        lastUpdatedAt: new Date()
      },
      {
        name: `${username}-dsa-notes`,
        description: "DSA practice and solved coding patterns.",
        url: `https://github.com/${username}/dsa-notes`,
        primaryLanguage: seed % 2 === 0 ? "Java" : "Python",
        languages: [seed % 2 === 0 ? "Java" : "Python"],
        stars: 0,
        forks: 0,
        openIssues: 0,
        hasReadme: seed % 3 !== 0,
        hasLiveDemo: false,
        topics: ["dsa", "leetcode"],
        lastUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20)
      }
    ];
    return {
      profile: {
        username,
        name: username,
        bio: "Fallback public profile analytics. Connect a real public GitHub username for live data.",
        avatarUrl: null,
        profileUrl: `https://github.com/${username}`,
        publicRepos: repositories.length,
        followers: seed % 8,
        following: seed % 12
      },
      repositories,
      rawData: { source: "fallback", reason: "GitHub API unavailable or rate limited" }
    };
  }

  private githubRepoQuality(repo: { description?: string | null; hasReadme?: boolean; hasLiveDemo?: boolean; stars?: number; forks?: number; topics?: string[]; languages?: string[] }) {
    return clampScore(
      20 +
        (repo.description ? 15 : 0) +
        (repo.hasReadme ? 25 : 0) +
        (repo.hasLiveDemo ? 20 : 0) +
        Math.min(10, (repo.stars ?? 0) + (repo.forks ?? 0)) +
        Math.min(10, (repo.topics?.length ?? 0) * 2 + (repo.languages?.length ?? 0) * 2)
    );
  }

  private async fetchLeetCodeProfile(username: string) {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Referer: `https://leetcode.com/${username}/` },
      body: JSON.stringify({
        query: `query matchedUser($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats { acSubmissionNum { difficulty count submissions } }
            profile { ranking reputation }
          }
          userContestRanking(username: $username) { rating globalRanking }
        }`,
        variables: { username }
      })
    });
    if (!response.ok) throw new Error("LeetCode profile unavailable");
    const payload = await response.json() as {
      data?: {
        matchedUser?: {
          profile?: { ranking?: number };
          submitStats?: { acSubmissionNum?: Array<{ difficulty: string; count: number }> };
        };
        userContestRanking?: { rating?: number };
      };
    };
    const matched = payload.data?.matchedUser;
    if (!matched) throw new Error("LeetCode profile unavailable");
    const stats = matched.submitStats?.acSubmissionNum ?? [];
    const count = (difficulty: string) => stats.find((item) => item.difficulty === difficulty)?.count ?? 0;
    return {
      profileUrl: `https://leetcode.com/${username}/`,
      totalSolved: count("All"),
      easySolved: count("Easy"),
      mediumSolved: count("Medium"),
      hardSolved: count("Hard"),
      ranking: matched.profile?.ranking,
      contestRating: payload.data?.userContestRanking?.rating,
      acceptanceRate: undefined,
      badges: [],
      topicStats: { Arrays: count("Easy"), Trees: Math.round(count("Medium") / 3), Graphs: Math.round(count("Medium") / 4), DP: count("Hard") }
    };
  }

  private mockLeetCodeProfile(username: string) {
    const seed = username.length;
    const easySolved = 35 + seed * 3;
    const mediumSolved = 18 + seed * 2;
    const hardSolved = seed % 9;
    return {
      profileUrl: `https://leetcode.com/${username}/`,
      totalSolved: easySolved + mediumSolved + hardSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      ranking: 150000 - seed * 2500,
      contestRating: 1200 + seed * 18,
      acceptanceRate: 48 + (seed % 20),
      badges: seed % 2 === 0 ? ["50 Days Badge"] : [],
      topicStats: { Arrays: 30, Trees: 18, Graphs: 10, DP: 8 }
    };
  }

  private async persistLeetCode(studentProfileId: string, username: string, stats: LeetCodeStats, source: string) {
    const scored = scoreLeetCode({ ...stats, topicStats: stats.topicStats });
    await this.prisma.studentProfile.update({ where: { id: studentProfileId }, data: { leetcodeUsername: username } });
    const saved = await this.prisma.leetCodeProfile.upsert({
      where: { studentProfileId },
      create: {
        studentProfileId,
        username,
        profileUrl: stats.profileUrl,
        totalSolved: stats.totalSolved,
        easySolved: stats.easySolved,
        mediumSolved: stats.mediumSolved,
        hardSolved: stats.hardSolved,
        ranking: stats.ranking,
        contestRating: stats.contestRating,
        acceptanceRate: stats.acceptanceRate,
        badgesJson: json(stats.badges),
        topicStatsJson: json(stats.topicStats),
        leetcodeScore: scored.score,
        strengthsJson: json(scored.strengths),
        weaknessesJson: json(scored.weaknesses),
        suggestionsJson: json(scored.suggestions),
        rawDataJson: json({ source, stats }),
        lastSyncedAt: new Date()
      },
      update: {
        username,
        profileUrl: stats.profileUrl,
        totalSolved: stats.totalSolved,
        easySolved: stats.easySolved,
        mediumSolved: stats.mediumSolved,
        hardSolved: stats.hardSolved,
        ranking: stats.ranking,
        contestRating: stats.contestRating,
        acceptanceRate: stats.acceptanceRate,
        badgesJson: json(stats.badges),
        topicStatsJson: json(stats.topicStats),
        leetcodeScore: scored.score,
        strengthsJson: json(scored.strengths),
        weaknessesJson: json(scored.weaknesses),
        suggestionsJson: json(scored.suggestions),
        rawDataJson: json({ source, stats }),
        lastSyncedAt: new Date()
      }
    });
    await this.refreshSkillVerification(studentProfileId);
    await this.calculateSkillProofForProfile(studentProfileId);
    return saved;
  }

  private mockHackerRankProfile(username: string) {
    const seed = username.length;
    return {
      profileUrl: `https://www.hackerrank.com/${username}`,
      problemSolvingScore: clampScore(45 + seed * 3),
      pythonScore: clampScore(50 + seed * 2),
      javaScore: clampScore(42 + seed * 2),
      sqlScore: clampScore(48 + seed * 3),
      certifications: seed % 2 === 0 ? ["SQL Basic"] : [],
      testScores: [{ name: "TPO coding test", score: clampScore(55 + seed * 3) }]
    };
  }

  private async persistHackerRank(studentProfileId: string, username: string, stats: HackerRankStats, source: string) {
    const scored = scoreHackerRank(stats);
    await this.prisma.studentProfile.update({ where: { id: studentProfileId }, data: { hackerrankUsername: username } });
    const saved = await this.prisma.hackerRankProfile.upsert({
      where: { studentProfileId },
      create: {
        studentProfileId,
        username,
        profileUrl: stats.profileUrl,
        problemSolvingScore: stats.problemSolvingScore,
        pythonScore: stats.pythonScore,
        javaScore: stats.javaScore,
        sqlScore: stats.sqlScore,
        certificationsJson: json(stats.certifications),
        testScoresJson: json(stats.testScores),
        hackerRankScore: scored.score,
        strengthsJson: json(scored.strengths),
        weaknessesJson: json(scored.weaknesses),
        suggestionsJson: json(scored.suggestions),
        rawDataJson: json({ source, stats }),
        lastSyncedAt: new Date()
      },
      update: {
        username,
        profileUrl: stats.profileUrl,
        problemSolvingScore: stats.problemSolvingScore,
        pythonScore: stats.pythonScore,
        javaScore: stats.javaScore,
        sqlScore: stats.sqlScore,
        certificationsJson: json(stats.certifications),
        testScoresJson: json(stats.testScores),
        hackerRankScore: scored.score,
        strengthsJson: json(scored.strengths),
        weaknessesJson: json(scored.weaknesses),
        suggestionsJson: json(scored.suggestions),
        rawDataJson: json({ source, stats }),
        lastSyncedAt: new Date()
      }
    });
    await this.refreshSkillVerification(studentProfileId);
    await this.calculateSkillProofForProfile(studentProfileId);
    return saved;
  }

  private parseCsvRows(csv: string) {
    const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((header) => header.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",");
      return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
    });
  }

  private buildResumeTextFromProfile(profile: { user: { name: string; email: string }; skills: Array<{ name: string }>; projects: Array<{ title: string; description: string; techStack: string[]; githubUrl: string | null; liveUrl: string | null }>; education: Array<{ degree: string; institute: string }> }, resumeUrl?: string) {
    return [
      profile.user.name,
      profile.user.email,
      "Education",
      ...profile.education.map((item) => `${item.degree} ${item.institute}`),
      "Skills",
      profile.skills.map((skill) => skill.name).join(", "),
      "Projects",
      ...profile.projects.map((project) => `${project.title}: ${project.description}. ${project.techStack.join(", ")} ${project.githubUrl ?? ""} ${project.liveUrl ?? ""}`),
      resumeUrl ? `Resume source: ${resumeUrl}` : ""
    ].join("\n");
  }

  private recommendedRolesForStudent(skills: string[]) {
    const skillSet = new Set(skills.map(normalizeSkill));
    return [
      skillSet.has("react") || skillSet.has("nextjs") ? "Frontend Engineer" : null,
      skillSet.has("java") || skillSet.has("spring boot") || skillSet.has("nestjs") ? "Backend Engineer" : null,
      skillSet.has("machine learning") || skillSet.has("python") ? "Data / AI Intern" : null,
      skillSet.has("sql") ? "Software Engineer" : null
    ].filter((role): role is string => Boolean(role)).slice(0, 3);
  }

  private countBy(values: string[]) {
    return this.countMapToList(values.reduce<Record<string, number>>((acc, value) => {
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {}));
  }

  private countMapToList(map: Record<string, number>) {
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }
}
