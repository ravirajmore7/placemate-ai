import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { checkEligibility } from "../src/drives/eligibility";
import {
  analyzeJobDescriptionText,
  calculateSkillProof,
  clampScore,
  normalizeSkill,
  proofLevel,
  scoreGitHub,
  scoreHackerRank,
  scoreLeetCode,
  scoreProjectQuality,
  uniqueStrings
} from "../src/stage2/stage2.scoring";
import { calculateReadiness, readinessJson } from "../src/students/readiness";

const prisma = new PrismaClient();

const branches = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];
const skillSets = [
  ["Java", "Spring Boot", "SQL", "React", "Git"],
  ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
  ["JavaScript", "React", "Node.js", "MongoDB", "GitHub"],
  ["C++", "DSA", "SQL", "Linux"],
  ["Java", "DSA", "Microservices", "MySQL", "Kubernetes"],
  ["Python", "Machine Learning", "Pandas", "SQL"],
  ["HTML", "CSS", "JavaScript", "React"],
  ["C", "Embedded Systems", "IoT", "Python"],
  ["Java", "React", "SQL", "REST APIs", "Docker"],
  ["C++", "LeetCode", "System Design", "AWS"]
];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.roadmapTask.deleteMany();
  await prisma.studentRoadmap.deleteMany();
  await prisma.skillGap.deleteMany();
  await prisma.jobMatchResult.deleteMany();
  await prisma.skillVerification.deleteMany();
  await prisma.skillProofScore.deleteMany();
  await prisma.jobDescriptionAnalysis.deleteMany();
  await prisma.resumeAnalysis.deleteMany();
  await prisma.hackerRankProfile.deleteMany();
  await prisma.leetCodeProfile.deleteMany();
  await prisma.gitHubRepository.deleteMany();
  await prisma.gitHubProfile.deleteMany();
  await prisma.application.deleteMany();
  await prisma.codingProfileSnapshot.deleteMany();
  await prisma.readinessScoreHistory.deleteMany();
  await prisma.education.deleteMany();
  await prisma.project.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.drive.deleteMany();
  await prisma.company.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password@123", 12);

  const [superAdmin, tpoAdmin] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Raviraj Platform Admin",
        email: "admin@placemate.ai",
        passwordHash,
        role: Role.SUPER_ADMIN
      }
    }),
    prisma.user.create({
      data: {
        name: "Priya TPO Admin",
        email: "tpo@placemate.ai",
        passwordHash,
        role: Role.TPO_ADMIN
      }
    })
  ]);

  const students = [];
  for (let index = 0; index < 10; index += 1) {
    const name = [
      "Aarav Sharma",
      "Meera Iyer",
      "Kabir Khan",
      "Ananya Reddy",
      "Rohan Patel",
      "Sanya Gupta",
      "Vikram Singh",
      "Isha Nair",
      "Dev Malhotra",
      "Nisha Verma"
    ][index];
    const branch = branches[index % branches.length];
    const cgpa = Number((6.2 + index * 0.28).toFixed(2));
    const activeBacklogs = index % 5 === 0 ? 1 : 0;
    const user = await prisma.user.create({
      data: {
        name,
        email: `student${index + 1}@placemate.ai`,
        passwordHash,
        role: Role.STUDENT,
        studentProfile: {
          create: {
            phone: `98765432${String(index).padStart(2, "0")}`,
            collegeName: "Nexus Institute of Technology",
            branch,
            year: 4,
            graduationYear: 2027,
            cgpa,
            activeBacklogs,
            location: ["Pune", "Bengaluru", "Hyderabad", "Mumbai"][index % 4],
            targetRole: ["Software Engineer", "Data Analyst", "Frontend Engineer", "Backend Engineer"][index % 4],
            preferredCompanies: ["TCS", "Infosys", "Amazon"],
            preferredLocation: ["Bengaluru", "Pune", "Remote"][index % 3],
            expectedSalary: 700000 + index * 90000,
            placementStatus: index > 7 ? "OPEN_TO_APPLY" : "PREPARING",
            githubUsername: index % 2 === 0 ? `${name.split(" ")[0].toLowerCase()}dev` : null,
            leetcodeUsername: index % 3 !== 0 ? `${name.split(" ")[0].toLowerCase()}codes` : null,
            hackerrankUsername: index % 4 === 0 ? `${name.split(" ")[0].toLowerCase()}hr` : null,
            resumeUrl: index % 3 === 0 ? null : `/uploads/${name.toLowerCase().replace(/\s/g, "-")}.pdf`
          }
        }
      },
      include: { studentProfile: true }
    });

    const profile = user.studentProfile!;
    await prisma.skill.createMany({
      data: skillSets[index].map((skill, skillIndex) => ({
        studentProfileId: profile.id,
        name: skill,
        category: skillIndex <= 1 ? "Programming" : skillIndex === 2 ? "Database" : "Tools",
        level: Math.min(5, 2 + ((skillIndex + index) % 4))
      }))
    });

    await prisma.project.createMany({
      data: [
        {
          studentProfileId: profile.id,
          title: `${name.split(" ")[0]}'s Placement Tracker`,
          description: "A dashboard for tracking company drives and preparation tasks.",
          techStack: ["React", "Node.js", "PostgreSQL"],
          githubUrl: `https://github.com/demo/${profile.id}-tracker`,
          liveUrl: "https://example.com",
          category: "Full Stack",
          startDate: new Date("2025-01-10"),
          endDate: new Date("2025-04-10")
        },
        ...(index % 2 === 0
          ? [
              {
                studentProfileId: profile.id,
                title: "SkillProof Portfolio",
                description: "Portfolio with project proof, coding links, and resume highlights.",
                techStack: ["Next.js", "Tailwind CSS"],
                githubUrl: `https://github.com/demo/${profile.id}-portfolio`,
                liveUrl: "https://example.com/portfolio",
                category: "Frontend",
                startDate: new Date("2025-05-01"),
                endDate: new Date("2025-06-15")
              }
            ]
          : [])
      ]
    });

    await prisma.education.create({
      data: {
        studentProfileId: profile.id,
        degree: "B.Tech",
        institute: "Nexus Institute of Technology",
        startYear: 2023,
        endYear: 2027,
        score: `${cgpa} CGPA`
      }
    });

    const hydrated = await prisma.studentProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: { skills: true, projects: true }
    });
    const readiness = calculateReadiness(hydrated);
    await prisma.studentProfile.update({ where: { id: profile.id }, data: { readinessScore: readiness.score } });
    await prisma.readinessScoreHistory.create({
      data: {
        studentProfileId: profile.id,
        score: readiness.score,
        ...readinessJson(readiness)
      }
    });

    for (const platform of ["GitHub", "LeetCode", "HackerRank"]) {
      const username =
        platform === "GitHub"
          ? hydrated.githubUsername
          : platform === "LeetCode"
            ? hydrated.leetcodeUsername
            : hydrated.hackerrankUsername;
      if (username) {
        await prisma.codingProfileSnapshot.create({
          data: {
            studentProfileId: profile.id,
            platform,
            username,
            totalSolved: platform === "LeetCode" ? 80 + index * 12 : undefined,
            ranking: platform === "LeetCode" ? `Top ${30 - index}%` : undefined,
            publicStatsJson: { source: "seed", stage: 1 }
          }
        });
      }
    }

    const stage2GithubUsername = hydrated.githubUsername ?? `${name.split(" ")[0].toLowerCase()}builds`;
    const githubRepositories = [
      {
        name: `${stage2GithubUsername}-placement-os`,
        description: "Full-stack placement intelligence dashboard with student proof, company drives, and analytics.",
        url: `https://github.com/demo/${stage2GithubUsername}-placement-os`,
        primaryLanguage: index % 2 === 0 ? "TypeScript" : "Java",
        languages: index % 2 === 0 ? ["TypeScript", "React", "PostgreSQL"] : ["Java", "Spring Boot", "SQL"],
        stars: index + 1,
        forks: Math.floor(index / 2),
        openIssues: index % 3,
        hasReadme: index !== 4,
        hasLiveDemo: index % 3 !== 1,
        topics: ["placement", "dashboard", "skillproof"],
        lastUpdatedAt: new Date(`2026-0${(index % 5) + 1}-12`)
      },
      {
        name: `${stage2GithubUsername}-dsa-lab`,
        description: "DSA practice repository with patterns for arrays, graphs, trees, and dynamic programming.",
        url: `https://github.com/demo/${stage2GithubUsername}-dsa-lab`,
        primaryLanguage: index % 2 === 0 ? "Python" : "C++",
        languages: index % 2 === 0 ? ["Python"] : ["C++"],
        stars: index % 4,
        forks: index % 2,
        openIssues: 0,
        hasReadme: index % 5 !== 0,
        hasLiveDemo: false,
        topics: ["dsa", "leetcode", "interview"],
        lastUpdatedAt: new Date(`2026-0${(index % 4) + 2}-08`)
      }
    ];
    const githubScore = scoreGitHub(githubRepositories, {
      publicRepos: githubRepositories.length + index,
      followers: 2 + index,
      following: 8 + index
    });

    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        githubUsername: stage2GithubUsername,
        leetcodeUsername: hydrated.leetcodeUsername ?? `${name.split(" ")[0].toLowerCase()}codes`,
        hackerrankUsername: hydrated.hackerrankUsername ?? `${name.split(" ")[0].toLowerCase()}hr`
      }
    });

    await prisma.gitHubProfile.create({
      data: {
        studentProfileId: profile.id,
        username: stage2GithubUsername,
        name,
        bio: `${hydrated.targetRole ?? "Software Engineer"} aspirant building verified project proof.`,
        avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`,
        profileUrl: `https://github.com/${stage2GithubUsername}`,
        publicRepos: githubRepositories.length + index,
        followers: 2 + index,
        following: 8 + index,
        githubScore: githubScore.score,
        strengthsJson: githubScore.strengths,
        weaknessesJson: githubScore.weaknesses,
        suggestionsJson: githubScore.suggestions,
        rawDataJson: { source: "seed", stage: 2 },
        lastSyncedAt: new Date(),
        repositories: {
          create: githubRepositories.map((repository) => ({
            name: repository.name,
            description: repository.description,
            url: repository.url,
            primaryLanguage: repository.primaryLanguage,
            languagesJson: repository.languages,
            stars: repository.stars,
            forks: repository.forks,
            openIssues: repository.openIssues,
            hasReadme: repository.hasReadme,
            hasLiveDemo: repository.hasLiveDemo,
            topicsJson: repository.topics,
            lastUpdatedAt: repository.lastUpdatedAt,
            qualityScore: Math.min(100, 30 + repository.languages.length * 8 + (repository.hasReadme ? 20 : 0) + (repository.hasLiveDemo ? 15 : 0) + repository.stars)
          }))
        }
      }
    });

    const leetcodeStats = {
      totalSolved: 80 + index * 18,
      easySolved: 38 + index * 7,
      mediumSolved: 32 + index * 9,
      hardSolved: Math.max(0, index - 2),
      contestRating: 1250 + index * 45,
      topicStats: { Arrays: 30 + index, Trees: 16 + index, Graphs: 8 + index, DP: 5 + index }
    };
    const leetcodeScore = scoreLeetCode(leetcodeStats);
    await prisma.leetCodeProfile.create({
      data: {
        studentProfileId: profile.id,
        username: hydrated.leetcodeUsername ?? `${name.split(" ")[0].toLowerCase()}codes`,
        profileUrl: `https://leetcode.com/${hydrated.leetcodeUsername ?? `${name.split(" ")[0].toLowerCase()}codes`}/`,
        totalSolved: leetcodeStats.totalSolved,
        easySolved: leetcodeStats.easySolved,
        mediumSolved: leetcodeStats.mediumSolved,
        hardSolved: leetcodeStats.hardSolved,
        ranking: 180000 - index * 12000,
        contestRating: leetcodeStats.contestRating,
        acceptanceRate: 47 + index * 2,
        badgesJson: index > 5 ? ["100 Days Badge", "Contest Participant"] : ["50 Days Badge"],
        topicStatsJson: leetcodeStats.topicStats,
        leetcodeScore: leetcodeScore.score,
        strengthsJson: leetcodeScore.strengths,
        weaknessesJson: leetcodeScore.weaknesses,
        suggestionsJson: leetcodeScore.suggestions,
        rawDataJson: { source: "seed", stage: 2 },
        lastSyncedAt: new Date()
      }
    });

    const hackerRankStats = {
      problemSolvingScore: Math.min(100, 45 + index * 6),
      pythonScore: Math.min(100, 52 + index * 5),
      javaScore: Math.min(100, 48 + index * 4),
      sqlScore: Math.min(100, 55 + index * 5),
      certifications: index % 3 === 0 ? ["SQL Basic", "Python Basic"] : index % 2 === 0 ? ["SQL Basic"] : [],
      testScores: [{ name: "Campus coding test", score: Math.min(100, 58 + index * 4) }]
    };
    const hackerRankScore = scoreHackerRank(hackerRankStats);
    await prisma.hackerRankProfile.create({
      data: {
        studentProfileId: profile.id,
        username: hydrated.hackerrankUsername ?? `${name.split(" ")[0].toLowerCase()}hr`,
        profileUrl: `https://www.hackerrank.com/${hydrated.hackerrankUsername ?? `${name.split(" ")[0].toLowerCase()}hr`}`,
        problemSolvingScore: hackerRankStats.problemSolvingScore,
        pythonScore: hackerRankStats.pythonScore,
        javaScore: hackerRankStats.javaScore,
        sqlScore: hackerRankStats.sqlScore,
        certificationsJson: hackerRankStats.certifications,
        testScoresJson: hackerRankStats.testScores,
        hackerRankScore: hackerRankScore.score,
        strengthsJson: hackerRankScore.strengths,
        weaknessesJson: hackerRankScore.weaknesses,
        suggestionsJson: hackerRankScore.suggestions,
        rawDataJson: { source: "seed", stage: 2 },
        lastSyncedAt: new Date()
      }
    });

    const detectedSkills = uniqueStrings([...skillSets[index], ...hydrated.projects.flatMap((project) => project.techStack)]);
    const resumeScore = Math.min(95, 56 + index * 4 + (index % 2 === 0 ? 8 : 0));
    await prisma.resumeAnalysis.create({
      data: {
        studentProfileId: profile.id,
        resumeUrl: hydrated.resumeUrl ?? `/uploads/${name.toLowerCase().replace(/\s/g, "-")}.pdf`,
        extractedText: `${name}\n${user.email}\nEducation B.Tech ${branch}\nSkills ${detectedSkills.join(", ")}\nProjects ${hydrated.projects.map((project) => project.title).join(", ")}`,
        detectedSkillsJson: detectedSkills,
        missingSectionsJson: index % 4 === 0 ? ["Achievements", "Live project links"] : [],
        weakPointsJson: index % 3 === 0 ? ["Project bullets need quantified impact"] : [],
        suggestionsJson: ["Add measurable project impact", "Keep GitHub and resume skills aligned", "Add live demo links for strongest projects"],
        atsScore: Math.min(96, resumeScore + 5),
        resumeScore,
        contactScore: 10,
        educationScore: 10,
        skillsScore: Math.min(15, detectedSkills.length * 3),
        projectsScore: index % 2 === 0 ? 18 : 14,
        experienceScore: index > 4 ? 9 : 5,
        formattingScore: 8,
        impactScore: index % 3 === 0 ? 4 : 8,
        linksScore: index % 2 === 0 ? 5 : 3
      }
    });

    const verificationRows = detectedSkills.map((skill) => {
      const normalized = normalizeSkill(skill);
      const hasGithub = githubRepositories.some((repository) => repository.languages.some((language) => normalizeSkill(language) === normalized));
      const hasProject = hydrated.projects.some((project) => project.techStack.some((tech) => normalizeSkill(tech) === normalized));
      const hasCoding = ["dsa", "data structures", "algorithms", "sql", "java", "python"].includes(normalized);
      const confidenceScore = Math.min(100, 25 + (hasGithub ? 30 : 0) + (hasProject ? 30 : 0) + (hasCoding ? 15 : 0) - (index % 5 === 0 ? 15 : 0));
      return {
        studentProfileId: profile.id,
        skillName: skill,
        proofLevel: proofLevel(confidenceScore),
        confidenceScore,
        sourcesJson: { resume: true, github: hasGithub, project: hasProject, codingProfile: hasCoding },
        suggestion: confidenceScore >= 80 ? "Strong proof from projects and public coding activity" : `Add stronger public proof for ${skill}`
      };
    });
    await prisma.skillVerification.createMany({ data: verificationRows, skipDuplicates: true });

    const skillVerificationScore = Math.round(verificationRows.reduce((sum, row) => sum + row.confidenceScore, 0) / verificationRows.length);
    const skillProof = calculateSkillProof({
      placementReadinessScore: readiness.score,
      resumeScore,
      githubScore: githubScore.score,
      leetcodeScore: leetcodeScore.score,
      hackerRankScore: hackerRankScore.score,
      projectScore: scoreProjectQuality(hydrated.projects),
      skillVerificationScore
    });
    await prisma.skillProofScore.create({
      data: {
        studentProfileId: profile.id,
        overallScore: skillProof.overallScore,
        level: skillProof.level,
        placementReadinessScore: readiness.score,
        resumeScore,
        githubScore: githubScore.score,
        leetcodeScore: leetcodeScore.score,
        hackerRankScore: hackerRankScore.score,
        projectScore: scoreProjectQuality(hydrated.projects),
        skillVerificationScore,
        breakdownJson: skillProof.breakdown,
        suggestionsJson: skillProof.suggestions
      }
    });

    students.push(profile.id);
  }

  await prisma.company.createMany({
    data: [
      { name: "TCS", website: "https://www.tcs.com", industry: "IT Services", description: "Global IT services and consulting company." },
      { name: "Infosys", website: "https://www.infosys.com", industry: "IT Services", description: "Digital services and consulting leader." },
      { name: "Wipro", website: "https://www.wipro.com", industry: "IT Services", description: "Technology services and consulting company." },
      { name: "Accenture", website: "https://www.accenture.com", industry: "Consulting", description: "Professional services and technology consulting firm." },
      { name: "Amazon", website: "https://www.amazon.jobs", industry: "Technology", description: "Global technology and ecommerce company." }
    ]
  });

  const companies = await prisma.company.findMany();
  const byName = Object.fromEntries(companies.map((company) => [company.name, company]));
  const drives = await Promise.all([
    prisma.drive.create({
      data: {
        companyId: byName.TCS.id,
        createdById: tpoAdmin.id,
        role: "TCS Ninja",
        description: "Entry-level software engineering role focused on Java, SQL, and problem solving.",
        ctc: 360000,
        location: "Pan India",
        jobType: "FULL_TIME",
        eligibleBranches: ["CSE", "IT", "ECE"],
        minimumCgpa: 6.0,
        maxBacklogs: 1,
        requiredSkills: ["Java", "SQL"],
        applicationDeadline: new Date("2026-07-15"),
        testDate: new Date("2026-07-20"),
        status: "OPEN"
      }
    }),
    prisma.drive.create({
      data: {
        companyId: byName.Infosys.id,
        createdById: tpoAdmin.id,
        role: "Specialist Programmer",
        description: "Advanced coding role for strong DSA and backend fundamentals.",
        ctc: 950000,
        location: "Bengaluru",
        jobType: "FULL_TIME",
        eligibleBranches: ["CSE", "IT"],
        minimumCgpa: 7.5,
        maxBacklogs: 0,
        requiredSkills: ["Java", "DSA", "SQL"],
        applicationDeadline: new Date("2026-08-01"),
        testDate: new Date("2026-08-06"),
        interviewDate: new Date("2026-08-14"),
        status: "OPEN"
      }
    }),
    prisma.drive.create({
      data: {
        companyId: byName.Wipro.id,
        createdById: tpoAdmin.id,
        role: "Wipro Elite",
        description: "Project engineer role across cloud, application development, and testing tracks.",
        ctc: 450000,
        location: "Hyderabad",
        jobType: "FULL_TIME",
        eligibleBranches: ["CSE", "IT", "ECE", "EEE"],
        minimumCgpa: 6.5,
        maxBacklogs: 0,
        requiredSkills: ["Java", "React"],
        applicationDeadline: new Date("2026-07-28"),
        status: "OPEN"
      }
    }),
    prisma.drive.create({
      data: {
        companyId: byName.Accenture.id,
        createdById: tpoAdmin.id,
        role: "ASE",
        description: "Associate software engineer role for application development and consulting projects.",
        ctc: 480000,
        location: "Pune",
        jobType: "FULL_TIME",
        eligibleBranches: ["CSE", "IT", "ECE", "EEE", "MECH"],
        minimumCgpa: 6.0,
        maxBacklogs: 1,
        requiredSkills: ["JavaScript", "SQL"],
        applicationDeadline: new Date("2026-08-10"),
        status: "OPEN"
      }
    }),
    prisma.drive.create({
      data: {
        companyId: byName.Amazon.id,
        createdById: tpoAdmin.id,
        role: "SDE Intern",
        description: "Software development internship with DSA-heavy online assessment and interviews.",
        stipend: 80000,
        location: "Bengaluru",
        jobType: "INTERNSHIP_PPO",
        eligibleBranches: ["CSE", "IT"],
        minimumCgpa: 8.0,
        maxBacklogs: 0,
        requiredSkills: ["DSA", "System Design", "AWS"],
        applicationDeadline: new Date("2026-09-01"),
        testDate: new Date("2026-09-05"),
        status: "OPEN"
      }
    })
  ]);

  const companyNameById = Object.fromEntries(companies.map((company) => [company.id, company.name]));
  for (const drive of drives) {
    const jd = analyzeJobDescriptionText(`${companyNameById[drive.companyId]} ${drive.role}\n${drive.description}\nRequired skills: ${drive.requiredSkills.join(", ")}`, drive.requiredSkills);
    await prisma.jobDescriptionAnalysis.create({
      data: {
        driveId: drive.id,
        extractedSkillsJson: jd.extractedSkills,
        requiredSkillsJson: jd.requiredSkills,
        preferredSkillsJson: jd.preferredSkills,
        roleCategory: jd.roleCategory,
        difficultyLevel: jd.difficultyLevel,
        keywordsJson: jd.keywords,
        analysisJson: jd
      }
    });
  }

  const stage2Students = await prisma.studentProfile.findMany({
    where: { id: { in: students } },
    include: {
      user: true,
      skills: true,
      projects: true,
      resumeAnalyses: { orderBy: { analyzedAt: "desc" }, take: 1 },
      leetcodeProfile: true,
      hackerRankProfile: true,
      skillVerifications: true
    }
  });

  for (const [studentIndex, student] of stage2Students.entries()) {
    const studentSkills = uniqueStrings([
      ...student.skills.map((skill) => skill.name),
      ...student.projects.flatMap((project) => project.techStack),
      ...(Array.isArray(student.resumeAnalyses[0]?.detectedSkillsJson) ? student.resumeAnalyses[0].detectedSkillsJson.map(String) : [])
    ]);
    const studentSkillSet = new Set(studentSkills.map(normalizeSkill));

    for (const drive of drives) {
      const requiredSkills = uniqueStrings(drive.requiredSkills);
      const matchedSkills = requiredSkills.filter((skill) => studentSkillSet.has(normalizeSkill(skill)));
      const missingSkills = requiredSkills.filter((skill) => !studentSkillSet.has(normalizeSkill(skill)));
      const weakSkills = student.skillVerifications
        .filter((verification) => requiredSkills.some((skill) => normalizeSkill(skill) === normalizeSkill(verification.skillName)) && verification.confidenceScore < 60)
        .map((verification) => verification.skillName);
      const strongProofSkills = student.skillVerifications
        .filter((verification) => requiredSkills.some((skill) => normalizeSkill(skill) === normalizeSkill(verification.skillName)) && verification.confidenceScore >= 75)
        .map((verification) => verification.skillName);
      const eligibility = checkEligibility(student, drive);
      const matchScore = clampScore(
        (requiredSkills.length ? (matchedSkills.length / requiredSkills.length) * 35 : 25) +
          Math.min(20, student.projects.length * 8) +
          (student.resumeAnalyses[0]?.atsScore ?? 0) * 0.15 +
          (((student.leetcodeProfile?.leetcodeScore ?? 0) + (student.hackerRankProfile?.hackerRankScore ?? 0)) / 2) * 0.15 +
          (eligibility.status === "ELIGIBLE" ? 10 : eligibility.status === "PARTIALLY_READY" ? 6 : 2) +
          Math.min(5, strongProofSkills.length * 2)
      );

      await prisma.jobMatchResult.create({
        data: {
          studentProfileId: student.id,
          driveId: drive.id,
          matchScore,
          matchedSkillsJson: matchedSkills,
          missingSkillsJson: missingSkills,
          weakSkillsJson: weakSkills,
          strongProofSkillsJson: strongProofSkills,
          reasonsJson: [`${matchedSkills.length}/${requiredSkills.length} required skills matched`, eligibility.reason],
          suggestionsJson: missingSkills.length
            ? missingSkills.map((skill) => `Build proof for ${skill}`)
            : ["Maintain proof quality and prepare for interviews"]
        }
      });

      await prisma.skillGap.createMany({
        data: uniqueStrings([...missingSkills, ...weakSkills]).map((skill) => ({
          studentProfileId: student.id,
          driveId: drive.id,
          skillName: skill,
          gapType: missingSkills.some((missing) => normalizeSkill(missing) === normalizeSkill(skill)) ? "MISSING" : "WEAK",
          priority: missingSkills.some((missing) => normalizeSkill(missing) === normalizeSkill(skill)) ? "HIGH" : "MEDIUM",
          recommendation: `Complete focused practice and add proof for ${skill}`
        }))
      });
    }

    const targetDrive = drives[studentIndex % drives.length];
    const targetCompany = companyNameById[targetDrive.companyId];
    const roadmap = await prisma.studentRoadmap.create({
      data: {
        studentProfileId: student.id,
        driveId: targetDrive.id,
        title: `30-day roadmap for ${targetCompany} ${targetDrive.role}`,
        durationDays: 30,
        goal: `Close gaps and prepare for ${targetCompany} ${targetDrive.role}`,
        roadmapJson: {
          weeks: [
            { week: 1, goal: "DSA basics and resume proof" },
            { week: 2, goal: "Medium problems and GitHub documentation" },
            { week: 3, goal: "Project polish and mock tests" },
            { week: 4, goal: "Interview revision and final readiness" }
          ]
        }
      }
    });

    await prisma.roadmapTask.createMany({
      data: [
        ["Solve 2 array or string problems", "DSA", "HIGH", 1],
        ["Add README and screenshots to one GitHub project", "GitHub", "HIGH", 3],
        ["Improve resume summary with measurable impact", "Resume", "MEDIUM", 5],
        ["Practice one mock coding test", "Interview", "MEDIUM", 10],
        ["Build one proof task for missing company skill", "Project", "HIGH", 14],
        ["Revise DBMS and SQL interview questions", "SQL", "MEDIUM", 18],
        ["Practice HR answer: Tell me about yourself", "Communication", "LOW", 22]
      ].map(([title, category, priority, day]) => ({
        roadmapId: roadmap.id,
        title: String(title),
        description: `Stage 2 demo task for ${targetCompany} readiness.`,
        category: String(category),
        priority: String(priority),
        dueDate: new Date(Date.now() + Number(day) * 24 * 60 * 60 * 1000)
      }))
    });
  }

  for (const [index, studentProfileId] of students.slice(0, 7).entries()) {
    const student = await prisma.studentProfile.findUniqueOrThrow({
      where: { id: studentProfileId },
      include: { skills: true }
    });
    const drive = drives[index % drives.length];
    const eligibility = checkEligibility(student, drive);
    await prisma.application.create({
      data: {
        studentProfileId,
        driveId: drive.id,
        status: [
          "APPLIED",
          "SHORTLISTED",
          "TEST_SCHEDULED",
          "TEST_COMPLETED",
          "INTERVIEW_SCHEDULED",
          "SELECTED",
          "APPLIED"
        ][index] as never,
        eligibilityStatus: eligibility.status,
        eligibilityReason: eligibility.reason
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      action: "SEED_COMPLETED",
      entityType: "SYSTEM",
      metadataJson: { students: 10, drives: 5 }
    }
  });

  console.log("Seed complete");
  console.log("Demo logins: student1@placemate.ai / Password@123, tpo@placemate.ai / Password@123, admin@placemate.ai / Password@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
