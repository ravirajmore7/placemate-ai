import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { checkEligibility } from "../src/drives/eligibility";
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
