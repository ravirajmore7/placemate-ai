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
  await prisma.accountStatusLog.deleteMany();
  await prisma.studentVisibilitySetting.deleteMany();
  await prisma.billingCustomer.deleteMany();
  await prisma.featureLimit.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.candidateShortlist.deleteMany();
  await prisma.candidateView.deleteMany();
  await prisma.recruiterApplication.deleteMany();
  await prisma.recruiterJob.deleteMany();
  await prisma.recruiterProfile.deleteMany();
  await prisma.teamInvitation.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
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

  const [superAdmin, tpoAdmin, collegeAdmin, companyAdmin, recruiterOne, recruiterTwo] = await Promise.all([
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
    }),
    prisma.user.create({
      data: {
        name: "Nisha College Admin",
        email: "college@placemate.ai",
        passwordHash,
        role: Role.COLLEGE_ADMIN
      }
    }),
    prisma.user.create({
      data: {
        name: "Arjun Company Admin",
        email: "company@placemate.ai",
        passwordHash,
        role: Role.COMPANY_ADMIN
      }
    }),
    prisma.user.create({
      data: {
        name: "Riya Recruiter",
        email: "recruiter@placemate.ai",
        passwordHash,
        role: Role.RECRUITER
      }
    }),
    prisma.user.create({
      data: {
        name: "Kabir Recruiter",
        email: "recruiter2@placemate.ai",
        passwordHash,
        role: Role.RECRUITER
      }
    })
  ]);

  const planRows = [
    {
      name: "Free Student",
      code: "free-student",
      audience: "STUDENT",
      description: "Basic placement profile and limited readiness intelligence.",
      priceMonthly: 0,
      priceYearly: 0,
      featuresJson: ["Basic profile", "Basic readiness score", "Limited SkillProof refresh"],
      limitsJson: { skillproof_refreshes: 3, company_fit_checks: 5, resume_analyses: 1, roadmaps: 1 }
    },
    {
      name: "Pro Student",
      code: "pro-student",
      audience: "STUDENT",
      description: "Unlimited SkillProof, resume analyzer, company fit reports, and roadmaps.",
      priceMonthly: 49900,
      priceYearly: 499900,
      featuresJson: ["Unlimited SkillProof refresh", "Resume analyzer", "Company fit reports", "Roadmaps"],
      limitsJson: { skillproof_refreshes: "unlimited", company_fit_checks: "unlimited", resume_analyses: "unlimited", roadmaps: "unlimited" }
    },
    {
      name: "College Basic",
      code: "college-basic",
      audience: "COLLEGE",
      description: "For small placement cells launching structured placement workflows.",
      priceMonthly: 999900,
      priceYearly: 9999000,
      featuresJson: ["500 students", "2 TPO admins", "20 drives per month", "Basic analytics"],
      limitsJson: { student_profiles: 500, tpo_admins: 2, drives: 20, exports: 0 }
    },
    {
      name: "College Pro",
      code: "college-pro",
      audience: "COLLEGE",
      description: "Advanced placement intelligence for growing colleges.",
      priceMonthly: 2499900,
      priceYearly: 24999000,
      featuresJson: ["3000 students", "10 TPO admins", "Unlimited drives", "Skill gap reports", "Exports"],
      limitsJson: { student_profiles: 3000, tpo_admins: 10, drives: "unlimited", exports: "unlimited" }
    },
    {
      name: "College Enterprise",
      code: "college-enterprise",
      audience: "COLLEGE",
      description: "Custom onboarding, security, support, and limits.",
      priceMonthly: 0,
      priceYearly: 0,
      featuresJson: ["Custom limits", "Dedicated support", "Advanced security", "Custom onboarding"],
      limitsJson: { student_profiles: "unlimited", tpo_admins: "unlimited", drives: "unlimited", exports: "unlimited" }
    },
    {
      name: "Recruiter Basic",
      code: "recruiter-basic",
      audience: "RECRUITER",
      description: "Starter hiring workflow for verified student discovery.",
      priceMonthly: 499900,
      priceYearly: 4999000,
      featuresJson: ["5 job posts/month", "100 candidate views/month", "Basic filters"],
      limitsJson: { job_posts: 5, candidate_views: 100, exports: 0 }
    },
    {
      name: "Recruiter Pro",
      code: "recruiter-pro",
      audience: "RECRUITER",
      description: "SkillProof candidate previews and full shortlisting pipeline.",
      priceMonthly: 1499900,
      priceYearly: 14999000,
      featuresJson: ["25 job posts/month", "1000 candidate views/month", "SkillProof preview", "Shortlisting pipeline"],
      limitsJson: { job_posts: 25, candidate_views: 1000, exports: 10 }
    },
    {
      name: "Recruiter Enterprise",
      code: "recruiter-enterprise",
      audience: "RECRUITER",
      description: "Unlimited recruiter hiring with dedicated support.",
      priceMonthly: 0,
      priceYearly: 0,
      featuresJson: ["Unlimited jobs", "Advanced search", "Bulk hiring", "Dedicated support"],
      limitsJson: { job_posts: "unlimited", candidate_views: "unlimited", exports: "unlimited" }
    }
  ];

  await prisma.plan.createMany({ data: planRows });
  const plans = await prisma.plan.findMany();
  const planByCode = Object.fromEntries(plans.map((plan) => [plan.code, plan]));

  const [demoCollegeOrg, demoCompanyOrg] = await Promise.all([
    prisma.organization.create({
      data: {
        name: "Nexus Institute of Technology",
        type: "COLLEGE",
        website: "https://nexus.example.edu",
        location: "Pune, Maharashtra",
        status: "active",
        metadataJson: {
          officialEmail: "placements@nexus.example.edu",
          departments: ["CSE", "IT", "ECE", "EEE"],
          approxStudentCount: 1200,
          tpoContactName: "Priya TPO Admin",
          tpoContactEmail: "tpo@placemate.ai",
          phone: "9876500001"
        }
      }
    }),
    prisma.organization.create({
      data: {
        name: "SkillForge Technologies",
        type: "COMPANY",
        website: "https://skillforge.example.com",
        industry: "Product Engineering",
        size: "501-1000",
        location: "Bengaluru, Karnataka",
        status: "active",
        description: "AI and cloud product engineering company hiring verified campus talent.",
        metadataJson: {
          headquarters: "Bengaluru",
          linkedInUrl: "https://linkedin.com/company/skillforge",
          careersPageUrl: "https://skillforge.example.com/careers",
          contactEmail: "talent@skillforge.example.com",
          verified: true
        }
      }
    })
  ]);

  await prisma.organizationMember.createMany({
    data: [
      { organizationId: demoCollegeOrg.id, userId: collegeAdmin.id, role: Role.COLLEGE_ADMIN },
      { organizationId: demoCollegeOrg.id, userId: tpoAdmin.id, role: Role.TPO_ADMIN, departmentsJson: ["CSE", "IT"] },
      { organizationId: demoCompanyOrg.id, userId: companyAdmin.id, role: Role.COMPANY_ADMIN },
      { organizationId: demoCompanyOrg.id, userId: recruiterOne.id, role: Role.RECRUITER },
      { organizationId: demoCompanyOrg.id, userId: recruiterTwo.id, role: Role.RECRUITER }
    ]
  });

  await prisma.recruiterProfile.createMany({
    data: [
      {
        userId: companyAdmin.id,
        organizationId: demoCompanyOrg.id,
        fullName: companyAdmin.name,
        designation: "Head of Talent",
        phone: "9876500100",
        linkedinUrl: "https://linkedin.com/in/arjun-company-admin",
        verified: true
      },
      {
        userId: recruiterOne.id,
        organizationId: demoCompanyOrg.id,
        fullName: recruiterOne.name,
        designation: "Campus Recruiter",
        phone: "9876500101",
        linkedinUrl: "https://linkedin.com/in/riya-recruiter",
        verified: true
      },
      {
        userId: recruiterTwo.id,
        organizationId: demoCompanyOrg.id,
        fullName: recruiterTwo.name,
        designation: "Technical Recruiter",
        phone: "9876500102",
        linkedinUrl: "https://linkedin.com/in/kabir-recruiter",
        verified: true
      }
    ]
  });

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

    await prisma.studentVisibilitySetting.create({
      data: {
        studentProfileId: profile.id,
        visibility: index < 8 ? "verified_recruiters" : "private",
        allowRecruiterContact: index < 8,
        showEmail: false,
        showPhone: false,
        showResume: index % 2 === 0,
        availabilityStatus: index > 7 ? "available_now" : "open_to_opportunities"
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

  const recruiterJobSeeds = [
    {
      title: "Backend Developer Intern",
      roleCategory: "Backend",
      jobType: "Internship",
      workMode: "Hybrid",
      location: "Bengaluru",
      stipend: 45000,
      experienceLevel: "Student / Fresher",
      requiredSkillsJson: ["Java", "Spring Boot", "SQL", "REST APIs"],
      preferredSkillsJson: ["Docker", "AWS"],
      minimumCgpa: 7,
      allowedBranchesJson: ["CSE", "IT"],
      maxBacklogs: 0,
      hiringRoundsJson: ["Online coding test", "Technical interview", "HR discussion"],
      openings: 8,
      deadline: new Date("2026-08-20"),
      visibility: "public",
      status: "open",
      description: "Work with SkillForge backend teams on APIs, data models, and cloud-ready services."
    },
    {
      title: "Data Analyst Intern",
      roleCategory: "Data",
      jobType: "Internship",
      workMode: "Remote",
      location: "Remote",
      stipend: 30000,
      experienceLevel: "Student",
      requiredSkillsJson: ["Python", "SQL", "Pandas", "Communication"],
      preferredSkillsJson: ["Power BI", "Machine Learning"],
      minimumCgpa: 6.5,
      allowedBranchesJson: ["CSE", "IT", "ECE"],
      maxBacklogs: 1,
      hiringRoundsJson: ["Analytics assignment", "Case interview"],
      openings: 5,
      deadline: new Date("2026-08-25"),
      visibility: "public",
      status: "open",
      description: "Analyze product and hiring data, build dashboards, and explain insights to business teams."
    },
    {
      title: "AI/ML Intern",
      roleCategory: "AI / ML",
      jobType: "Internship + PPO",
      workMode: "Hybrid",
      location: "Pune",
      stipend: 65000,
      experienceLevel: "Advanced Student",
      requiredSkillsJson: ["Python", "Machine Learning", "FastAPI", "SQL"],
      preferredSkillsJson: ["Vector Search", "Docker"],
      minimumCgpa: 7.5,
      allowedBranchesJson: ["CSE", "IT"],
      maxBacklogs: 0,
      hiringRoundsJson: ["ML assignment", "Technical deep dive", "Manager round"],
      openings: 4,
      deadline: new Date("2026-09-05"),
      visibility: "specific_colleges",
      status: "open",
      description: "Build ML-backed SkillProof intelligence for candidate matching and resume insights."
    },
    {
      title: "Full Stack Developer",
      roleCategory: "Full Stack",
      jobType: "Full-time",
      workMode: "On-site",
      location: "Bengaluru",
      ctc: 1200000,
      experienceLevel: "Fresher",
      requiredSkillsJson: ["React", "Node.js", "PostgreSQL", "Git"],
      preferredSkillsJson: ["Next.js", "NestJS", "Tailwind CSS"],
      minimumCgpa: 7,
      allowedBranchesJson: ["CSE", "IT"],
      maxBacklogs: 0,
      hiringRoundsJson: ["Coding test", "System design basics", "Project discussion"],
      openings: 10,
      deadline: new Date("2026-09-12"),
      visibility: "public",
      status: "open",
      description: "Join product engineering to ship SaaS dashboards, APIs, and polished frontend experiences."
    },
    {
      title: "Cloud Engineer Intern",
      roleCategory: "Cloud",
      jobType: "Internship",
      workMode: "Hybrid",
      location: "Hyderabad",
      stipend: 50000,
      experienceLevel: "Student",
      requiredSkillsJson: ["AWS", "Docker", "Linux", "SQL"],
      preferredSkillsJson: ["Kubernetes", "Terraform"],
      minimumCgpa: 7,
      allowedBranchesJson: ["CSE", "IT", "ECE"],
      maxBacklogs: 0,
      hiringRoundsJson: ["Cloud basics test", "Technical interview"],
      openings: 6,
      deadline: new Date("2026-09-18"),
      visibility: "public",
      status: "open",
      description: "Support cloud deployments, observability, and secure infrastructure for SaaS products."
    }
  ];

  const recruiterJobs = await Promise.all(
    recruiterJobSeeds.map((job, index) =>
      prisma.recruiterJob.create({
        data: {
          organizationId: demoCompanyOrg.id,
          createdById: index % 2 === 0 ? recruiterOne.id : recruiterTwo.id,
          ...job
        }
      })
    )
  );

  for (const [index, studentProfileId] of students.slice(0, 6).entries()) {
    const job = recruiterJobs[index % recruiterJobs.length];
    await prisma.recruiterApplication.create({
      data: {
        recruiterJobId: job.id,
        studentProfileId,
        status: ["applied", "shortlisted", "assessment", "interview", "offered", "applied"][index],
        matchScore: clampScore(62 + index * 6),
        source: index % 2 === 0 ? "student" : "invite"
      }
    });
  }

  await prisma.candidateView.createMany({
    data: students.slice(0, 5).map((studentProfileId, index) => ({
      recruiterId: index % 2 === 0 ? recruiterOne.id : recruiterTwo.id,
      studentProfileId,
      recruiterJobId: recruiterJobs[index % recruiterJobs.length].id,
      organizationId: demoCompanyOrg.id,
      viewedAt: new Date(Date.now() - index * 60 * 60 * 1000)
    }))
  });

  await prisma.candidateShortlist.createMany({
    data: students.slice(1, 6).map((studentProfileId, index) => ({
      recruiterId: index % 2 === 0 ? recruiterOne.id : recruiterTwo.id,
      studentProfileId,
      recruiterJobId: recruiterJobs[index % recruiterJobs.length].id,
      organizationId: demoCompanyOrg.id,
      status: ["saved", "shortlisted", "assessment", "interview", "offered"][index],
      rating: 3 + (index % 3),
      notes: "Strong SkillProof signal from demo seed data.",
      interviewDate: index === 3 ? new Date("2026-08-30T10:30:00.000Z") : null
    }))
  });

  await prisma.contactRequest.createMany({
    data: students.slice(0, 3).map((studentProfileId, index) => ({
      recruiterId: recruiterOne.id,
      studentProfileId,
      organizationId: demoCompanyOrg.id,
      recruiterJobId: recruiterJobs[index].id,
      status: index === 0 ? "accepted" : "pending",
      message: "We liked your SkillProof profile and would like to discuss an opportunity."
    }))
  });

  const collegeSubscription = await prisma.subscription.create({
    data: {
      organizationId: demoCollegeOrg.id,
      planId: planByCode["college-pro"].id,
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart: new Date("2026-06-01"),
      currentPeriodEnd: new Date("2026-06-30"),
      razorpayCustomerId: "cust_demo_college",
      razorpaySubscriptionId: "sub_demo_college"
    }
  });
  const recruiterSubscription = await prisma.subscription.create({
    data: {
      organizationId: demoCompanyOrg.id,
      planId: planByCode["recruiter-pro"].id,
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart: new Date("2026-06-01"),
      currentPeriodEnd: new Date("2026-06-30"),
      razorpayCustomerId: "cust_demo_recruiter",
      razorpaySubscriptionId: "sub_demo_recruiter"
    }
  });

  const [collegePayment, recruiterPayment] = await Promise.all([
    prisma.payment.create({
      data: {
        subscriptionId: collegeSubscription.id,
        organizationId: demoCollegeOrg.id,
        userId: collegeAdmin.id,
        providerPaymentId: "pay_demo_college",
        providerOrderId: "order_demo_college",
        providerSubscriptionId: "sub_demo_college",
        amount: planByCode["college-pro"].priceMonthly,
        currency: "INR",
        status: "paid",
        method: "upi",
        paidAt: new Date("2026-06-02"),
        rawPayloadJson: { source: "seed" }
      }
    }),
    prisma.payment.create({
      data: {
        subscriptionId: recruiterSubscription.id,
        organizationId: demoCompanyOrg.id,
        userId: companyAdmin.id,
        providerPaymentId: "pay_demo_recruiter",
        providerOrderId: "order_demo_recruiter",
        providerSubscriptionId: "sub_demo_recruiter",
        amount: planByCode["recruiter-pro"].priceMonthly,
        currency: "INR",
        status: "paid",
        method: "card",
        paidAt: new Date("2026-06-02"),
        rawPayloadJson: { source: "seed" }
      }
    })
  ]);

  await prisma.invoice.createMany({
    data: [
      {
        subscriptionId: collegeSubscription.id,
        organizationId: demoCollegeOrg.id,
        paymentId: collegePayment.id,
        invoiceNumber: "PM-SEED-COLLEGE-001",
        amount: collegePayment.amount,
        currency: "INR",
        status: "paid",
        paidAt: collegePayment.paidAt
      },
      {
        subscriptionId: recruiterSubscription.id,
        organizationId: demoCompanyOrg.id,
        paymentId: recruiterPayment.id,
        invoiceNumber: "PM-SEED-RECRUITER-001",
        amount: recruiterPayment.amount,
        currency: "INR",
        status: "paid",
        paidAt: recruiterPayment.paidAt
      }
    ]
  });

  const periodStart = new Date("2026-06-01");
  const periodEnd = new Date("2026-06-30T23:59:59.999Z");
  await prisma.usageRecord.createMany({
    data: [
      { organizationId: demoCompanyOrg.id, userId: recruiterOne.id, featureKey: "candidate_views", count: 58, periodStart, periodEnd, metadataJson: { source: "seed" } },
      { organizationId: demoCompanyOrg.id, userId: recruiterOne.id, featureKey: "job_posts", count: recruiterJobs.length, periodStart, periodEnd, metadataJson: { source: "seed" } },
      { organizationId: demoCollegeOrg.id, userId: tpoAdmin.id, featureKey: "drives", count: drives.length, periodStart, periodEnd, metadataJson: { source: "seed" } },
      { organizationId: demoCollegeOrg.id, userId: collegeAdmin.id, featureKey: "student_profiles", count: students.length, periodStart, periodEnd, metadataJson: { source: "seed" } },
      { userId: stage2Students[0].userId, featureKey: "resume_analyses", count: 1, periodStart, periodEnd, metadataJson: { source: "seed" } }
    ]
  });

  await prisma.billingCustomer.createMany({
    data: [
      { organizationId: demoCollegeOrg.id, providerCustomerId: "cust_demo_college", email: "college@placemate.ai", name: demoCollegeOrg.name },
      { organizationId: demoCompanyOrg.id, providerCustomerId: "cust_demo_recruiter", email: "company@placemate.ai", name: demoCompanyOrg.name }
    ]
  });

  await prisma.teamInvitation.create({
    data: {
      organizationId: demoCompanyOrg.id,
      email: "future-recruiter@skillforge.example.com",
      role: Role.RECRUITER,
      token: "seed-invite-token",
      status: "pending",
      expiresAt: new Date("2026-07-01"),
      invitedById: companyAdmin.id
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      action: "SEED_COMPLETED",
      entityType: "SYSTEM",
      metadataJson: { students: 10, drives: 5, recruiterJobs: recruiterJobs.length, stage: 3 }
    }
  });

  await prisma.accountStatusLog.create({
    data: {
      organizationId: demoCompanyOrg.id,
      action: "activated",
      reason: "Seeded demo company account",
      performedById: superAdmin.id
    }
  });

  console.log("Seed complete");
  console.log("Demo logins: student1@placemate.ai, tpo@placemate.ai, college@placemate.ai, recruiter@placemate.ai, company@placemate.ai, admin@placemate.ai / Password@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
