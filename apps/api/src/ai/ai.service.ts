import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, Role } from "@prisma/client";
import { createHash } from "crypto";
import { AuthUser } from "../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { buildRoadmap, clampScore, extractSkillsFromText, normalizeSkill, TECH_SKILLS, uniqueStrings } from "../stage2/stage2.scoring";

const json = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

const RECRUITER_ROLES = [Role.RECRUITER, Role.COMPANY_ADMIN] as string[];
const TPO_ROLES = [Role.TPO_ADMIN, Role.COLLEGE_ADMIN, Role.SUPER_ADMIN] as string[];

const STUDENT_INCLUDE = {
  user: true,
  skills: true,
  projects: true,
  education: true,
  applications: { include: { drive: { include: { company: true } } }, orderBy: { appliedAt: "desc" as const }, take: 10 },
  githubProfile: { include: { repositories: { orderBy: { qualityScore: "desc" as const }, take: 8 } } },
  leetcodeProfile: true,
  hackerRankProfile: true,
  resumeAnalyses: { orderBy: { analyzedAt: "desc" as const }, take: 1 },
  skillProofScores: { orderBy: { calculatedAt: "desc" as const }, take: 1 },
  skillVerifications: { orderBy: { confidenceScore: "asc" as const }, take: 20 }
} satisfies Prisma.StudentProfileInclude;

type HydratedStudent = Prisma.StudentProfileGetPayload<{ include: typeof STUDENT_INCLUDE }>;

type CandidateResult = {
  id: string;
  name: string;
  collegeName?: string | null;
  branch?: string | null;
  graduationYear?: number | null;
  cgpa?: number | null;
  location?: string | null;
  targetRole?: string | null;
  placementStatus?: string;
  skills: string[];
  topProjects: Array<Record<string, unknown>>;
  skillProofScore: number;
  resumeScore: number;
  githubScore: number;
  leetcodeScore: number;
  hackerRankScore: number;
  matchScore: number;
  hiringConfidence?: number;
  missingSkills?: string[];
  riskFactors?: string[];
  reasons?: string[];
};

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async mentorChat(user: AuthUser, body: Record<string, unknown>) {
    const startedAt = Date.now();
    const prompt = this.text(body.message ?? body.prompt);
    if (!prompt) throw new BadRequestException("Mentor prompt is required");

    const profile = await this.studentProfileByUser(user.id);
    const signals = this.studentSignals(profile);
    const weakSkills = this.weakSkills(profile);
    const recommendations = this.mentorRecommendations(prompt, profile, weakSkills);
    const response = [
      `Ziva: ${this.mentorOpening(prompt, profile)}`,
      "",
      `Your current placement signal is ${signals.skillProofScore}/100 with ${signals.resumeScore}/100 resume strength and ${signals.leetcodeScore}/100 DSA signal.`,
      "",
      "Recommended moves:",
      ...recommendations.map((item, index) => `${index + 1}. ${item}`)
    ].join("\n");

    const conversation = await this.prisma.aIConversation.create({
      data: {
        userId: user.id,
        role: user.role,
        module: "career_mentor",
        title: prompt.slice(0, 80),
        contextJson: json({ studentProfileId: profile.id, signals })
      }
    });

    const chat = await this.prisma.careerMentorChat.create({
      data: {
        conversationId: conversation.id,
        studentProfileId: profile.id,
        userId: user.id,
        prompt,
        response,
        signalsJson: json(signals),
        recommendationsJson: json(recommendations)
      }
    });

    await this.recordUsage(user, "ai_career_mentor", prompt, response, startedAt, { conversationId: conversation.id });
    return { conversation, chat, response, signals, recommendations };
  }

  async mentorHistory(user: AuthUser) {
    const profile = await this.studentProfileByUser(user.id);
    const items = await this.prisma.careerMentorChat.findMany({
      where: { studentProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return { items };
  }

  async generateResume(user: AuthUser, body: Record<string, unknown>) {
    const startedAt = Date.now();
    const profile = await this.studentProfileByUser(user.id);
    const variant = this.text(body.variant) || "ATS Resume";
    const company = this.text(body.companyName);
    const jdSkills = extractSkillsFromText(this.text(body.jobDescription));
    const profileSkills = profile.skills.map((skill) => skill.name);
    const keywords = uniqueStrings([...profileSkills, ...jdSkills, "ownership", "impact", "collaboration"]);
    const bullets = this.arrayFrom(body.bullets).length ? this.arrayFrom(body.bullets) : profile.projects.map((project) => project.description);
    const rewrittenBullets = bullets.slice(0, 6).map((bullet) => this.rewriteResumeBullet(bullet));
    const topProjects = profile.projects.slice(0, 3);
    const sections = {
      headline: `${profile.user.name} - ${profile.targetRole ?? "Software Engineer"}${company ? ` for ${company}` : ""}`,
      summary: `${profile.user.name} is a ${profile.branch ?? "engineering"} student focused on ${keywords.slice(0, 5).join(", ")} with verified placement readiness signals.`,
      skills: keywords.slice(0, 14),
      projects: topProjects.map((project) => ({
        title: project.title,
        stack: project.techStack,
        bullet: this.rewriteResumeBullet(`${project.description} ${project.techStack.join(" ")}`)
      })),
      education: profile.education.map((item) => `${item.degree}, ${item.institute}${item.score ? ` - ${item.score}` : ""}`)
    };
    const resumeText = [
      sections.headline,
      profile.user.email,
      "",
      "SUMMARY",
      sections.summary,
      "",
      "SKILLS",
      sections.skills.join(", "),
      "",
      "PROJECTS",
      ...sections.projects.map((project) => `${project.title}: ${project.bullet}`),
      "",
      "EDUCATION",
      ...sections.education,
      "",
      "IMPACT BULLETS",
      ...rewrittenBullets.map((bullet) => `- ${bullet}`)
    ].join("\n");

    const payload = {
      variant,
      companyName: company || null,
      atsKeywords: sections.skills,
      sections,
      rewrittenBullets,
      resumeText,
      exports: {
        pdf: "Use the Resume Builder export action to print this ATS resume as PDF.",
        docx: "Use the Resume Builder export action to download the structured resume payload."
      }
    };
    await this.recordUsage(user, "ai_resume_builder", `${variant} ${company} ${jdSkills.join(" ")}`, resumeText, startedAt, { variant });
    return payload;
  }

  async startMockInterview(user: AuthUser, body: Record<string, unknown>) {
    const startedAt = Date.now();
    const profile = await this.studentProfileByUser(user.id);
    const mode = this.text(body.mode) || "Technical Interview";
    const focusSkills = uniqueStrings([...this.arrayFrom(body.skills), ...profile.skills.map((skill) => skill.name)]).slice(0, 5);
    const questions = this.interviewQuestions(mode, focusSkills, profile.targetRole ?? "Software Engineer");
    const session = await this.prisma.interviewSession.create({
      data: {
        studentProfileId: profile.id,
        userId: user.id,
        mode,
        metadataJson: json({ focusSkills, targetRole: profile.targetRole })
      }
    });
    await this.prisma.interviewQuestion.createMany({
      data: questions.map((question, index) => ({
        interviewSessionId: session.id,
        order: index + 1,
        question: question.question,
        followUpsJson: json(question.followUps),
        evaluationCriteriaJson: json(question.criteria),
        expectedSignalsJson: json(question.expectedSignals)
      }))
    });
    const savedQuestions = await this.prisma.interviewQuestion.findMany({
      where: { interviewSessionId: session.id },
      orderBy: { order: "asc" }
    });
    await this.recordUsage(user, "ai_mock_interview", mode, questions.map((item) => item.question).join(" "), startedAt, { sessionId: session.id });
    return { session, questions: savedQuestions };
  }

  async evaluateMockInterview(user: AuthUser, body: Record<string, unknown>) {
    const startedAt = Date.now();
    const sessionId = this.text(body.sessionId);
    if (!sessionId) throw new BadRequestException("Interview session ID is required");
    const session = await this.prisma.interviewSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== user.id) throw new NotFoundException("Interview session not found");

    const answers = this.answerMap(body.answers);
    const questions = await this.prisma.interviewQuestion.findMany({ where: { interviewSessionId: sessionId } });
    const allAnswers = questions.map((question) => answers.get(question.id) ?? answers.get(String(question.order)) ?? "").join("\n");
    const skillHits = extractSkillsFromText(allAnswers).length;
    const wordCount = allAnswers.split(/\s+/).filter(Boolean).length;
    const quantified = (allAnswers.match(/\b\d+%|\b\d+\+|\b\d+x|\b\d+\s?(users|ms|requests|students|rows)\b/gi) ?? []).length;
    const communicationScore = clampScore(45 + Math.min(25, wordCount / 8) + (allAnswers.includes(".") ? 10 : 0));
    const confidenceScore = clampScore(48 + Math.min(24, wordCount / 10) + (allAnswers.toLowerCase().includes("i ") ? 6 : 0));
    const technicalScore = clampScore(42 + skillHits * 8 + quantified * 4);
    const problemSolvingScore = clampScore(45 + (allAnswers.toLowerCase().includes("tradeoff") ? 12 : 0) + (allAnswers.toLowerCase().includes("complexity") ? 12 : 0) + skillHits * 4);
    const overallScore = clampScore((communicationScore + confidenceScore + technicalScore + problemSolvingScore) / 4);
    const feedback = {
      strengths: [
        ...(communicationScore >= 70 ? ["Clear communication structure"] : []),
        ...(technicalScore >= 70 ? ["Good use of technical proof"] : []),
        ...(problemSolvingScore >= 70 ? ["Problem-solving approach is visible"] : [])
      ],
      improvements: [
        ...(communicationScore < 70 ? ["Answer with situation, action, result, and learning"] : []),
        ...(technicalScore < 70 ? ["Use specific stack choices, metrics, and tradeoffs"] : []),
        ...(problemSolvingScore < 70 ? ["Explain complexity, edge cases, and alternate approaches"] : [])
      ],
      nextQuestions: this.interviewQuestions(session.mode, extractSkillsFromText(allAnswers), "target role").slice(0, 2)
    };

    const evaluation = await this.prisma.interviewEvaluation.create({
      data: {
        interviewSessionId: sessionId,
        communicationScore,
        confidenceScore,
        technicalScore,
        problemSolvingScore,
        overallScore,
        feedbackJson: json(feedback)
      }
    });
    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: "completed", completedAt: new Date(), currentScore: overallScore }
    });
    await this.recordUsage(user, "ai_interview_evaluation", session.mode, JSON.stringify(feedback), startedAt, { sessionId });
    return { evaluation, feedback };
  }

  async placementPrediction(user: AuthUser) {
    const startedAt = Date.now();
    const profile = await this.studentProfileByUser(user.id);
    const signals = this.studentSignals(profile);
    const placementProbability = clampScore(signals.skillProofScore * 0.42 + profile.readinessScore * 0.32 + (profile.cgpa ?? 0) * 3 + (profile.applications.length ? 8 : 0));
    const interviewSuccessProbability = clampScore(signals.leetcodeScore * 0.28 + signals.resumeScore * 0.22 + signals.skillProofScore * 0.32 + 12);
    const offerProbability = clampScore(placementProbability * 0.56 + interviewSuccessProbability * 0.34 + (profile.applications.some((item) => item.status === "SHORTLISTED") ? 10 : 0));
    const salaryBase = profile.expectedSalary ? profile.expectedSalary / 100000 : 4 + signals.skillProofScore / 13;
    const salaryMinLpa = Number(Math.max(3, salaryBase * 0.8).toFixed(1));
    const salaryMaxLpa = Number(Math.max(salaryMinLpa + 2, salaryBase * 1.45 + signals.githubScore / 22).toFixed(1));
    const riskLevel = placementProbability >= 78 ? "Low" : placementProbability >= 58 ? "Medium" : "High";
    const factors = {
      positive: [
        ...(signals.skillProofScore >= 75 ? ["Strong SkillProof signal"] : []),
        ...(signals.resumeScore >= 75 ? ["ATS-ready resume"] : []),
        ...(signals.leetcodeScore >= 70 ? ["DSA readiness is visible"] : [])
      ],
      risks: this.riskFactors(profile)
    };
    const recommendedActions = this.mentorRecommendations("placement prediction", profile, this.weakSkills(profile));
    const prediction = await this.prisma.placementPrediction.create({
      data: {
        studentProfileId: profile.id,
        placementProbability,
        interviewSuccessProbability,
        offerProbability,
        salaryMinLpa,
        salaryMaxLpa,
        riskLevel,
        factorsJson: json(factors),
        recommendedActionsJson: json(recommendedActions)
      }
    });
    await this.recordUsage(user, "ai_placement_prediction", profile.id, JSON.stringify(prediction), startedAt, { riskLevel });
    return { ...prediction, factors, recommendedActions };
  }

  async semanticTalentSearch(user: AuthUser, body: Record<string, unknown>) {
    const startedAt = Date.now();
    const query = this.text(body.query) || "placement ready software engineer";
    const limit = this.limit(body.limit, 10, 50);
    const querySkills = extractSkillsFromText(query);
    const queryVector = this.localEmbedding(query);
    const candidates = await this.candidatePool(user, 100);
    const items = candidates
      .map((candidate) => {
        const text = this.studentText(candidate);
        const vector = this.localEmbedding(text);
        const skillOverlap = this.skillOverlap(querySkills, candidate.skills.map((skill) => skill.name));
        const similarity = Math.max(0, this.cosine(queryVector, vector));
        const signals = this.studentSignals(candidate);
        const matchScore = clampScore(similarity * 62 + skillOverlap * 18 + signals.skillProofScore * 0.2);
        return {
          ...this.candidateSummary(candidate, matchScore),
          semanticScore: clampScore(similarity * 100),
          matchedSkills: querySkills.filter((skill) => candidate.skills.some((candidateSkill) => normalizeSkill(candidateSkill.name) === normalizeSkill(skill))),
          vectorProvider: "local-hash",
          vectorDimensions: vector.length
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    await Promise.all(items.map((item) => this.upsertCandidateEmbedding(item.id, query, item.matchScore)));
    await this.recordUsage(user, "semantic_talent_search", query, JSON.stringify(items.slice(0, 3)), startedAt, { resultCount: items.length });
    return {
      query,
      vector: {
        provider: "local-hash",
        database: this.config.get<string>("QDRANT_URL") ? "qdrant-configured" : "local-fallback",
        dimensions: 32
      },
      items,
      total: items.length
    };
  }

  async matchCandidates(user: AuthUser, body: Record<string, unknown>) {
    const startedAt = Date.now();
    const limit = this.limit(body.limit, 10, 50);
    const job = await this.matchingJob(body);
    const candidates = await this.candidatePool(user, 100);
    const items = candidates
      .map((candidate) => {
        const required = job.requiredSkills;
        const candidateSkills = candidate.skills.map((skill) => skill.name);
        const matchedSkills = required.filter((skill) => candidateSkills.some((candidateSkill) => normalizeSkill(candidateSkill) === normalizeSkill(skill)));
        const missingSkills = required.filter((skill) => !matchedSkills.some((matched) => normalizeSkill(matched) === normalizeSkill(skill)));
        const signals = this.studentSignals(candidate);
        const eligibilityScore = (candidate.cgpa ?? 0) >= job.minimumCgpa && candidate.activeBacklogs <= job.maxBacklogs ? 16 : 4;
        const matchScore = clampScore((matchedSkills.length / Math.max(required.length, 1)) * 52 + signals.skillProofScore * 0.28 + eligibilityScore);
        const hiringConfidence = clampScore(matchScore * 0.72 + signals.resumeScore * 0.14 + signals.githubScore * 0.08 + signals.leetcodeScore * 0.06);
        const riskFactors = [
          ...(missingSkills.length ? [`Missing ${missingSkills.slice(0, 3).join(", ")}`] : []),
          ...((candidate.cgpa ?? 0) < job.minimumCgpa ? ["Below minimum CGPA"] : []),
          ...(candidate.activeBacklogs > job.maxBacklogs ? ["Backlog eligibility risk"] : [])
        ];
        return {
          ...this.candidateSummary(candidate, matchScore),
          hiringConfidence,
          matchedSkills,
          missingSkills,
          riskFactors,
          reasons: [`${matchedSkills.length}/${Math.max(required.length, 1)} required skills matched`, `SkillProof ${signals.skillProofScore}/100`, `Resume ${signals.resumeScore}/100`]
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    await Promise.all(items.slice(0, 10).map((item) => this.prisma.candidateRecommendation.create({
      data: {
        recruiterJobId: job.recruiterJobId,
        driveId: job.driveId,
        recruiterId: RECRUITER_ROLES.includes(user.role) ? user.id : undefined,
        studentProfileId: item.id,
        matchScore: item.matchScore,
        hiringConfidence: item.hiringConfidence ?? item.matchScore,
        riskFactorsJson: json(item.riskFactors ?? []),
        missingSkillsJson: json(item.missingSkills ?? []),
        reasonsJson: json(item.reasons ?? [])
      }
    })));
    await this.recordUsage(user, "ai_candidate_matching", job.title, JSON.stringify(items.slice(0, 3)), startedAt, { job });
    return { job, items, total: items.length };
  }

  async recruiterCopilot(user: AuthUser, body: Record<string, unknown>) {
    const startedAt = Date.now();
    const prompt = this.text(body.prompt ?? body.message) || "Find top candidates";
    const search = await this.semanticTalentSearch(user, { query: prompt, limit: 5 });
    const questions = /question|interview/i.test(prompt) ? this.interviewQuestions("Technical Interview", extractSkillsFromText(prompt), "candidate").map((item) => item.question) : [];
    const risks = search.items.flatMap((candidate: Record<string, unknown>) => this.arrayFrom((candidate as CandidateResult).riskFactors)).slice(0, 5);
    const answer = [
      "Recruiter Copilot summary:",
      `${search.items.length} candidates ranked using semantic fit, SkillProof score, resume signal, and public proof.`,
      questions.length ? "Interview questions are ready for the selected role." : "Use a JD or natural-language requirement to tighten the shortlist.",
      risks.length ? `Hiring risks to inspect: ${risks.join("; ")}` : "No severe hiring risks found in the top ranked set."
    ].join("\n");
    await this.prisma.aIConversation.create({
      data: { userId: user.id, role: user.role, module: "recruiter_copilot", title: prompt.slice(0, 80), contextJson: json({ resultCount: search.items.length }) }
    });
    await this.recordUsage(user, "ai_recruiter_copilot", prompt, answer, startedAt, { questions: questions.length });
    return { answer, candidates: search.items, questions, risks, vector: search.vector };
  }

  async tpoCopilot(user: AuthUser, body: Record<string, unknown>) {
    const startedAt = Date.now();
    const prompt = this.text(body.prompt ?? body.message) || "Department readiness report";
    const students = await this.candidatePool(user, 250);
    const readinessValues = students.map((student) => student.readinessScore ?? 0);
    const averageReadiness = clampScore(readinessValues.reduce((sum, value) => sum + value, 0) / Math.max(readinessValues.length, 1));
    const atRisk = students.filter((student) => this.studentSignals(student).skillProofScore < 60 || (student.readinessScore ?? 0) < 60);
    const branchReadiness = this.groupStudents(students, "branch").map((item) => ({
      branch: item.name,
      students: item.count,
      averageReadiness: clampScore(item.students.reduce((sum, student) => sum + (student.readinessScore ?? 0), 0) / Math.max(item.students.length, 1))
    }));
    const weakSkills = this.topMissingSkills(students);
    const answer = [
      "TPO Copilot report:",
      `${students.length} students analyzed with average readiness ${averageReadiness}/100.`,
      `${atRisk.length} students need placement-risk intervention.`,
      weakSkills.length ? `Priority training topics: ${weakSkills.slice(0, 5).map((item) => item.name).join(", ")}.` : "No major skill gap cluster found."
    ].join("\n");
    await this.prisma.aIConversation.create({
      data: { userId: user.id, role: user.role, module: "tpo_copilot", title: prompt.slice(0, 80), contextJson: json({ students: students.length, atRisk: atRisk.length }) }
    });
    await this.recordUsage(user, "ai_tpo_copilot", prompt, answer, startedAt, { averageReadiness });
    return {
      answer,
      cards: {
        totalStudents: students.length,
        averageReadiness,
        studentsAtRisk: atRisk.length,
        placementForecast: `${clampScore(averageReadiness * 0.8 + 16)}%`
      },
      charts: { branchReadiness, weakSkills },
      atRiskStudents: atRisk.slice(0, 10).map((student) => this.candidateSummary(student, this.studentSignals(student).skillProofScore))
    };
  }

  async skillGapAnalysis(user: AuthUser, body: Record<string, unknown>) {
    const startedAt = Date.now();
    const studentProfileId = this.text(body.studentProfileId);
    const profile = user.role === Role.STUDENT ? await this.studentProfileByUser(user.id) : studentProfileId ? await this.studentProfileById(studentProfileId) : null;
    const targetRole = this.text(body.targetRole) || profile?.targetRole || "Software Engineer";
    const marketSkills = uniqueStrings([...this.roleSkills(targetRole), ...extractSkillsFromText(this.text(body.jobDescription))]);
    const studentSkills = profile?.skills.map((skill) => skill.name) ?? [];
    const missingSkills = marketSkills.filter((skill) => !studentSkills.some((studentSkill) => normalizeSkill(studentSkill) === normalizeSkill(skill)));
    const suggestedCertifications = missingSkills.slice(0, 4).map((skill) => `${skill} fundamentals certification`);
    const suggestedProjects = missingSkills.slice(0, 4).map((skill) => `Build a ${skill} proof project with README, metrics, and deployment notes`);
    const roadmap = buildRoadmap(Number(body.durationDays ?? 30), targetRole, missingSkills.slice(0, 5));
    const saved = await this.prisma.skillGapAnalysis.create({
      data: {
        studentProfileId: profile?.id,
        recruiterJobId: this.text(body.recruiterJobId) || undefined,
        driveId: this.text(body.driveId) || undefined,
        query: `${targetRole} ${this.text(body.jobDescription)}`.trim(),
        missingSkillsJson: json(missingSkills),
        suggestedCertificationsJson: json(suggestedCertifications),
        suggestedProjectsJson: json(suggestedProjects),
        roadmapJson: json(roadmap),
        marketSkillsJson: json(marketSkills)
      }
    });
    await this.recordUsage(user, "ai_skill_gap", targetRole, JSON.stringify(missingSkills), startedAt, { studentProfileId: profile?.id });
    return { ...saved, targetRole, marketSkills, missingSkills, suggestedCertifications, suggestedProjects, roadmap };
  }

  async generateRoadmap(user: AuthUser, body: Record<string, unknown>) {
    const startedAt = Date.now();
    const profile = user.role === Role.STUDENT ? await this.studentProfileByUser(user.id) : this.text(body.studentProfileId) ? await this.studentProfileById(this.text(body.studentProfileId)) : null;
    const targetRole = this.text(body.targetRole ?? body.goal) || profile?.targetRole || "Software Engineer";
    const durationDays = this.duration(body.durationDays ?? body.duration);
    const gaps = uniqueStrings([...this.arrayFrom(body.weakSkills), ...this.roleSkills(targetRole).slice(0, 5)]);
    const plan = buildRoadmap(durationDays, targetRole, gaps);
    const saved = await this.prisma.roadmapPlan.create({
      data: {
        studentProfileId: profile?.id,
        userId: user.id,
        targetRole,
        durationDays,
        planJson: json(plan)
      }
    });
    await this.recordUsage(user, "ai_roadmap_generator", targetRole, JSON.stringify(plan.dailyTasks.slice(0, 3)), startedAt, { durationDays });
    return { ...saved, plan };
  }

  async generatePortfolio(user: AuthUser, body: Record<string, unknown>) {
    const startedAt = Date.now();
    const profile = await this.studentProfileByUser(user.id);
    const type = this.text(body.type) || "Personal Portfolio Website";
    const title = `${profile.user.name} - ${profile.targetRole ?? "Software Engineer"} Portfolio`;
    const content = {
      title,
      tagline: `Verified ${profile.targetRole ?? "software"} candidate with SkillProof-backed projects.`,
      about: `${profile.user.name} studies at ${profile.collegeName ?? "college"} and focuses on ${profile.skills.slice(0, 6).map((skill) => skill.name).join(", ")}.`,
      skills: profile.skills.map((skill) => skill.name),
      projects: profile.projects.map((project) => ({
        title: project.title,
        description: project.description,
        techStack: project.techStack,
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl
      })),
      links: {
        github: profile.githubUsername ? `https://github.com/${profile.githubUsername}` : undefined,
        leetcode: profile.leetcodeUsername ? `https://leetcode.com/${profile.leetcodeUsername}/` : undefined,
        resume: profile.resumeUrl
      }
    };
    const staticHtml = this.portfolioHtml(content);
    const nextProject = this.portfolioNextProject(content);
    const saved = await this.prisma.portfolioGeneration.create({
      data: {
        studentProfileId: profile.id,
        userId: user.id,
        type,
        title,
        contentJson: json(content),
        exportFormat: "nextjs+static-html",
        exportPayload: JSON.stringify({ staticHtml, nextProject })
      }
    });
    await this.recordUsage(user, "ai_portfolio_generator", type, title, startedAt, { projectCount: profile.projects.length });
    return { ...saved, content, exports: { staticHtml, nextProject } };
  }

  async adminDashboard(query: Record<string, string | undefined>) {
    const days = Math.max(1, Math.min(Number(query.days ?? 30), 365));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where = { createdAt: { gte: since } };
    const [featureUsage, modelUsage, totals, conversations, predictions, interviews, recommendations, assessments, portfolios] = await Promise.all([
      this.prisma.aIUsageMetric.groupBy({
        by: ["featureKey"],
        where,
        _sum: { totalTokens: true, estimatedCostInr: true },
        _count: { _all: true }
      }),
      this.prisma.aIUsageMetric.groupBy({
        by: ["provider", "model"],
        where,
        _sum: { totalTokens: true, estimatedCostInr: true },
        _count: { _all: true }
      }),
      this.prisma.aIUsageMetric.aggregate({
        where,
        _sum: { totalTokens: true, estimatedCostInr: true },
        _count: { _all: true }
      }),
      this.prisma.aIConversation.count(),
      this.prisma.placementPrediction.count(),
      this.prisma.interviewSession.count(),
      this.prisma.candidateRecommendation.count(),
      this.prisma.assessment.count(),
      this.prisma.portfolioGeneration.count()
    ]);

    return {
      periodDays: days,
      cards: {
        totalAiCalls: totals._count._all,
        tokenConsumption: totals._sum.totalTokens ?? 0,
        estimatedCostInr: Number((totals._sum.estimatedCostInr ?? 0).toFixed(2)),
        conversations,
        placementPredictions: predictions,
        mockInterviews: interviews,
        candidateRecommendations: recommendations,
        assessments,
        portfolios
      },
      featureUsage: featureUsage.map((item) => ({
        featureKey: item.featureKey,
        calls: item._count._all,
        tokens: item._sum.totalTokens ?? 0,
        costInr: Number((item._sum.estimatedCostInr ?? 0).toFixed(2))
      })),
      modelAnalytics: modelUsage.map((item) => ({
        provider: item.provider,
        model: item.model,
        calls: item._count._all,
        tokens: item._sum.totalTokens ?? 0,
        costInr: Number((item._sum.estimatedCostInr ?? 0).toFixed(2))
      })),
      adoptionReports: [
        { module: "AI Career Mentor", count: await this.prisma.careerMentorChat.count() },
        { module: "Resume Builder", count: featureUsage.find((item) => item.featureKey === "ai_resume_builder")?._count._all ?? 0 },
        { module: "Mock Interview", count: interviews },
        { module: "Semantic Search", count: featureUsage.find((item) => item.featureKey === "semantic_talent_search")?._count._all ?? 0 }
      ]
    };
  }

  vectorStatus() {
    return {
      provider: "Qdrant",
      configured: Boolean(this.config.get<string>("QDRANT_URL")),
      url: this.config.get<string>("QDRANT_URL") ?? null,
      fallbackProvider: "local-hash",
      collections: ["candidate_embeddings", "job_embeddings", "resume_embeddings"],
      dimensions: 32
    };
  }

  private studentInclude() {
    return STUDENT_INCLUDE;
  }

  private async studentProfileByUser(userId: string): Promise<HydratedStudent> {
    const found = await this.prisma.studentProfile.findUnique({ where: { userId }, include: this.studentInclude() });
    if (found) return found;
    await this.prisma.studentProfile.create({ data: { userId, collegeName: "" } });
    return this.prisma.studentProfile.findUniqueOrThrow({ where: { userId }, include: this.studentInclude() });
  }

  private async studentProfileById(studentProfileId: string): Promise<HydratedStudent> {
    return this.prisma.studentProfile.findUniqueOrThrow({ where: { id: studentProfileId }, include: this.studentInclude() });
  }

  private async candidatePool(user: AuthUser, take: number): Promise<HydratedStudent[]> {
    const where: Prisma.StudentProfileWhereInput = {};
    if (RECRUITER_ROLES.includes(user.role)) {
      const visible = await this.prisma.studentVisibilitySetting.findMany({
        where: { visibility: { in: ["verified_recruiters", "public"] } },
        select: { studentProfileId: true }
      });
      const visibleIds = visible.map((item) => item.studentProfileId);
      if (!visibleIds.length) return [];
      where.id = { in: visibleIds };
    } else if (!TPO_ROLES.includes(user.role)) {
      throw new ForbiddenException("This role cannot search candidates");
    }
    return this.prisma.studentProfile.findMany({
      where,
      orderBy: [{ readinessScore: "desc" }, { cgpa: "desc" }],
      take,
      include: this.studentInclude()
    });
  }

  private studentSignals(profile: HydratedStudent) {
    return {
      readinessScore: profile.readinessScore ?? 0,
      skillProofScore: profile.skillProofScores[0]?.overallScore ?? profile.readinessScore ?? 0,
      resumeScore: profile.resumeAnalyses[0]?.resumeScore ?? 0,
      atsScore: profile.resumeAnalyses[0]?.atsScore ?? 0,
      githubScore: profile.githubProfile?.githubScore ?? 0,
      leetcodeScore: profile.leetcodeProfile?.leetcodeScore ?? 0,
      hackerRankScore: profile.hackerRankProfile?.hackerRankScore ?? 0,
      projectScore: profile.projects.length ? clampScore(profile.projects.reduce((sum, project) => sum + project.techStack.length * 8 + (project.githubUrl ? 15 : 0) + (project.liveUrl ? 10 : 0), 0) / profile.projects.length) : 0
    };
  }

  private weakSkills(profile: HydratedStudent) {
    const weak = profile.skillVerifications.filter((item) => item.confidenceScore < 60).map((item) => item.skillName);
    const roleSkills = this.roleSkills(profile.targetRole ?? "Software Engineer");
    const currentSkills = profile.skills.map((skill) => skill.name);
    return uniqueStrings([...weak, ...roleSkills.filter((skill) => !currentSkills.some((current) => normalizeSkill(current) === normalizeSkill(skill)))]);
  }

  private riskFactors(profile: HydratedStudent) {
    const signals = this.studentSignals(profile);
    return [
      ...(signals.resumeScore < 70 ? ["Resume score below recruiter-ready threshold"] : []),
      ...(signals.leetcodeScore < 65 ? ["DSA interview success risk"] : []),
      ...(signals.githubScore < 60 ? ["Low public project proof"] : []),
      ...(profile.activeBacklogs > 0 ? ["Active backlog eligibility risk"] : []),
      ...(profile.applications.some((item) => item.status === "REJECTED") ? ["Recent rejection pattern needs review"] : [])
    ];
  }

  private candidateSummary(profile: HydratedStudent, matchScore: number): CandidateResult {
    const signals = this.studentSignals(profile);
    return {
      id: profile.id,
      name: profile.user.name,
      collegeName: profile.collegeName,
      branch: profile.branch,
      graduationYear: profile.graduationYear,
      cgpa: profile.cgpa,
      location: profile.location,
      targetRole: profile.targetRole,
      placementStatus: profile.placementStatus,
      skills: profile.skills.map((skill) => skill.name).slice(0, 10),
      topProjects: profile.projects.slice(0, 3).map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        techStack: project.techStack,
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl
      })),
      skillProofScore: signals.skillProofScore,
      resumeScore: signals.resumeScore,
      githubScore: signals.githubScore,
      leetcodeScore: signals.leetcodeScore,
      hackerRankScore: signals.hackerRankScore,
      matchScore
    };
  }

  private studentText(profile: HydratedStudent) {
    return [
      profile.user.name,
      profile.collegeName,
      profile.branch,
      profile.targetRole,
      profile.location,
      profile.skills.map((skill) => skill.name).join(" "),
      profile.projects.map((project) => `${project.title} ${project.description} ${project.techStack.join(" ")}`).join(" "),
      profile.githubProfile?.repositories.map((repo) => `${repo.name} ${repo.description ?? ""} ${repo.primaryLanguage ?? ""}`).join(" "),
      `SkillProof ${this.studentSignals(profile).skillProofScore}`
    ].filter(Boolean).join(" ");
  }

  private mentorOpening(prompt: string, profile: HydratedStudent) {
    const lower = prompt.toLowerCase();
    if (lower.includes("reject")) return "Rejections usually point to a signal mismatch, so I would tighten your resume proof, DSA readiness, and company-fit targeting together.";
    if (lower.includes("company")) return `For ${profile.targetRole ?? "your target role"}, start with companies whose skill demand overlaps your strongest verified skills.`;
    if (lower.includes("project")) return "Choose projects that prove production thinking: auth, database design, deployment, metrics, and clear README documentation.";
    if (lower.includes("certification")) return "Certifications help most when they close a visible gap and are paired with project proof.";
    return "I read your profile as a placement signal system, so the fastest improvement comes from strengthening the weakest proof source first.";
  }

  private mentorRecommendations(prompt: string, profile: HydratedStudent, weakSkills: string[]) {
    const signals = this.studentSignals(profile);
    const lower = prompt.toLowerCase();
    return uniqueStrings([
      ...(signals.resumeScore < 75 || lower.includes("resume") ? ["Rewrite top project bullets with metrics, action verbs, GitHub links, and ATS keywords"] : []),
      ...(signals.leetcodeScore < 70 || lower.includes("interview") ? ["Complete 30 medium DSA problems across arrays, trees, graphs, and DP"] : []),
      ...(signals.githubScore < 70 ? ["Improve GitHub proof with README screenshots, live demos, and repository topics"] : []),
      ...(weakSkills.slice(0, 3).map((skill) => `Add proof for ${skill} through one project, one assessment, or one certification`) ?? []),
      ...(lower.includes("company") ? [`Target roles requiring ${profile.skills.slice(0, 4).map((skill) => skill.name).join(", ")}`] : []),
      "Run one mock interview and convert feedback into a 7-day action sprint"
    ]).slice(0, 7);
  }

  private rewriteResumeBullet(bullet: string) {
    const clean = bullet.trim() || "Built a placement-ready technical project";
    const hasMetric = /\d/.test(clean);
    return `${clean.replace(/\.$/, "")}; improved clarity, ownership, and recruiter-visible proof${hasMetric ? "" : " with measurable outcomes to be added"}.`;
  }

  private interviewQuestions(mode: string, skills: string[], targetRole: string) {
    const focus = skills.length ? skills : this.roleSkills(targetRole).slice(0, 4);
    const lower = mode.toLowerCase();
    if (lower.includes("hr")) {
      return [
        this.question("Tell me about yourself and your target role.", ["What proof supports that role?", "Why this company?"], ["clarity", "role alignment"], focus),
        this.question("Describe a time you handled rejection or feedback.", ["What changed after that?", "How did you measure improvement?"], ["reflection", "ownership"], focus),
        this.question("Why should we hire you over another fresher?", ["Which project proves this?", "What is your strongest verified skill?"], ["confidence", "evidence"], focus)
      ];
    }
    if (lower.includes("dsa")) {
      return [
        this.question("How would you detect a cycle in a directed graph?", ["What is the time complexity?", "How would you test edge cases?"], ["algorithm", "complexity"], ["Graphs", "DSA"]),
        this.question("Explain when you would use dynamic programming.", ["What are overlapping subproblems?", "How do you optimize space?"], ["DP", "tradeoffs"], ["Dynamic Programming", "DSA"]),
        this.question("Design an approach for top K frequent elements.", ["Heap or bucket sort?", "Complexity?"], ["data structures", "complexity"], ["DSA"])
      ];
    }
    if (lower.includes("system")) {
      return [
        this.question("Design a placement application tracking system.", ["How would you model applications?", "How would you scale search?"], ["architecture", "database"], focus),
        this.question("Design notifications for drive deadlines.", ["Queue choice?", "Failure handling?"], ["reliability", "queues"], ["Redis", "System Design"]),
        this.question("How would you add semantic candidate search?", ["Where do embeddings live?", "How do you re-rank?"], ["vector search", "ranking"], ["Qdrant", "Search"])
      ];
    }
    if (lower.includes("behavior")) {
      return [
        this.question("Tell me about a conflict in a team project.", ["What did you do?", "What was the result?"], ["communication", "ownership"], focus),
        this.question("Describe a time you learned a skill quickly.", ["Why did you choose it?", "How did you prove it?"], ["learning", "proof"], focus),
        this.question("What would your teammates say you improve in a project?", ["Example?", "Evidence?"], ["self-awareness"], focus)
      ];
    }
    return [
      this.question(`Explain your strongest ${focus[0] ?? "technical"} project end to end.`, ["What tradeoff did you make?", "How did you test it?"], ["project depth", "tradeoffs"], focus),
      this.question(`How would you debug a production issue in a ${targetRole} role?`, ["What logs matter?", "How do you prevent recurrence?"], ["debugging", "ownership"], focus),
      this.question(`Which ${focus[1] ?? "backend"} concept are you weakest in and how are you closing it?`, ["What is your plan?", "How will you prove progress?"], ["honesty", "roadmap"], focus)
    ];
  }

  private question(question: string, followUps: string[], criteria: string[], expectedSignals: string[]) {
    return { question, followUps, criteria, expectedSignals };
  }

  private async matchingJob(body: Record<string, unknown>) {
    const recruiterJobId = this.text(body.recruiterJobId);
    if (recruiterJobId) {
      const job = await this.prisma.recruiterJob.findUnique({ where: { id: recruiterJobId } });
      if (!job) throw new NotFoundException("Recruiter job not found");
      return {
        recruiterJobId,
        driveId: undefined,
        title: job.title,
        requiredSkills: this.arrayFrom(job.requiredSkillsJson),
        minimumCgpa: job.minimumCgpa,
        maxBacklogs: job.maxBacklogs,
        description: job.description
      };
    }
    const driveId = this.text(body.driveId);
    if (driveId) {
      const drive = await this.prisma.drive.findUnique({ where: { id: driveId }, include: { company: true } });
      if (!drive) throw new NotFoundException("Drive not found");
      return {
        recruiterJobId: undefined,
        driveId,
        title: `${drive.company.name} ${drive.role}`,
        requiredSkills: drive.requiredSkills,
        minimumCgpa: drive.minimumCgpa,
        maxBacklogs: drive.maxBacklogs,
        description: drive.description
      };
    }
    const jobDescription = this.text(body.jobDescription);
    const requiredSkills = uniqueStrings([...this.arrayFrom(body.requiredSkills), ...extractSkillsFromText(jobDescription)]);
    return {
      recruiterJobId: undefined,
      driveId: undefined,
      title: this.text(body.title) || "Custom job description",
      requiredSkills: requiredSkills.length ? requiredSkills : ["DSA", "SQL", "Communication"],
      minimumCgpa: Number(body.minimumCgpa ?? 0),
      maxBacklogs: Number(body.maxBacklogs ?? 99),
      description: jobDescription
    };
  }

  private roleSkills(role: string) {
    const lower = role.toLowerCase();
    if (lower.includes("data")) return ["Python", "SQL", "Pandas", "NumPy", "Machine Learning", "Statistics"];
    if (lower.includes("ai")) return ["Python", "Machine Learning", "FastAPI", "Vector Search", "LangChain", "SQL"];
    if (lower.includes("devops")) return ["Linux", "Docker", "Kubernetes", "AWS", "CI/CD", "Redis"];
    if (lower.includes("cloud")) return ["AWS", "Docker", "Kubernetes", "Linux", "Networking", "Terraform"];
    if (lower.includes("cyber")) return ["Linux", "Networking", "Security", "Python", "SQL", "OWASP"];
    if (lower.includes("frontend")) return ["JavaScript", "TypeScript", "React", "Next.js", "HTML", "CSS"];
    return ["DSA", "Java", "SQL", "React", "System Design", "Communication"];
  }

  private async upsertCandidateEmbedding(studentProfileId: string, query: string, score: number) {
    const text = `${studentProfileId} ${query}`;
    const embeddingHash = this.hash(text);
    await this.prisma.candidateEmbedding.upsert({
      where: { provider_embeddingHash: { provider: "local-hash", embeddingHash } },
      create: {
        studentProfileId,
        text,
        vectorJson: json(this.localEmbedding(text)),
        provider: "local-hash",
        dimensions: 32,
        embeddingHash,
        metadataJson: json({ lastScore: score })
      },
      update: {
        text,
        vectorJson: json(this.localEmbedding(text)),
        metadataJson: json({ lastScore: score })
      }
    });
  }

  private groupStudents(students: HydratedStudent[], field: "branch") {
    const map = new Map<string, HydratedStudent[]>();
    for (const student of students) {
      const key = String(student[field] ?? "Unknown");
      map.set(key, [...(map.get(key) ?? []), student]);
    }
    return [...map.entries()].map(([name, grouped]) => ({ name, count: grouped.length, students: grouped })).sort((a, b) => b.count - a.count);
  }

  private topMissingSkills(students: HydratedStudent[]) {
    const counts = new Map<string, number>();
    for (const student of students) {
      for (const skill of this.weakSkills(student).slice(0, 5)) {
        counts.set(skill, (counts.get(skill) ?? 0) + 1);
      }
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }

  private skillOverlap(querySkills: string[], candidateSkills: string[]) {
    if (!querySkills.length) return 0.5;
    const matched = querySkills.filter((skill) => candidateSkills.some((candidateSkill) => normalizeSkill(candidateSkill) === normalizeSkill(skill)));
    return matched.length / querySkills.length;
  }

  private localEmbedding(text: string, dimensions = 32) {
    const vector = Array.from({ length: dimensions }, () => 0);
    const tokens = text.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean);
    tokens.forEach((token, tokenIndex) => {
      const digest = createHash("sha256").update(token).digest();
      const index = digest[0] % dimensions;
      vector[index] += 1 + Math.min(3, token.length / 8) + (tokenIndex % 3) * 0.1;
    });
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => Number((value / magnitude).toFixed(6)));
  }

  private cosine(left: number[], right: number[]) {
    return left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
  }

  private portfolioHtml(content: Record<string, unknown>) {
    const projects = (content.projects as Array<Record<string, unknown>>).map((project) => `<section><h2>${project.title}</h2><p>${project.description}</p><p>${this.arrayFrom(project.techStack).join(", ")}</p></section>`).join("");
    return `<!doctype html><html><head><meta charset="utf-8"><title>${content.title}</title><style>body{font-family:Inter,Arial,sans-serif;margin:40px;line-height:1.6}main{max-width:880px;margin:auto}section{border-top:1px solid #ddd;padding:20px 0}</style></head><body><main><h1>${content.title}</h1><p>${content.tagline}</p><section><h2>About</h2><p>${content.about}</p></section><section><h2>Skills</h2><p>${this.arrayFrom(content.skills).join(", ")}</p></section>${projects}</main></body></html>`;
  }

  private portfolioNextProject(content: Record<string, unknown>) {
    return {
      "package.json": JSON.stringify({ scripts: { dev: "next dev", build: "next build" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest" } }, null, 2),
      "app/page.tsx": `export default function Page(){return <main className="mx-auto max-w-4xl p-8"><h1>${content.title}</h1><p>${content.tagline}</p></main>}`,
      "app/globals.css": "body{font-family:system-ui,sans-serif;margin:0}"
    };
  }

  private async recordUsage(user: AuthUser, featureKey: string, prompt: string, output: string, startedAt: number, metadata?: unknown) {
    const promptTokens = this.estimateTokens(prompt);
    const completionTokens = this.estimateTokens(output);
    const totalTokens = promptTokens + completionTokens;
    await this.prisma.aIUsageMetric.create({
      data: {
        userId: user.id,
        role: user.role,
        featureKey,
        provider: this.config.get<string>("AI_PROVIDER") ?? "local",
        model: this.config.get<string>("AI_MODEL") ?? "stage4-local-v1",
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostInr: Number((totalTokens * 0.00002).toFixed(4)),
        latencyMs: Date.now() - startedAt,
        metadataJson: metadata === undefined ? undefined : json(metadata)
      }
    });
  }

  private estimateTokens(text: string) {
    return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.25));
  }

  private answerMap(value: unknown) {
    const map = new Map<string, string>();
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "string") map.set(String(index + 1), item);
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          map.set(this.text(record.questionId ?? record.id ?? index + 1), this.text(record.answer ?? record.value));
        }
      });
    } else if (value && typeof value === "object") {
      for (const [key, answer] of Object.entries(value as Record<string, unknown>)) map.set(key, this.text(answer));
    }
    return map;
  }

  private text(value: unknown) {
    if (value === undefined || value === null) return "";
    return String(value).trim();
  }

  private arrayFrom(value: unknown): string[] {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
    return [];
  }

  private duration(value: unknown) {
    const parsed = Number(value ?? 30);
    return [30, 60, 90].includes(parsed) ? parsed : 30;
  }

  private limit(value: unknown, fallback: number, max: number) {
    return Math.min(Math.max(Number(value ?? fallback), 1), max);
  }

  private hash(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
}
