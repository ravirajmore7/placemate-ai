import type {
  Application,
  Drive,
  GitHubProfile,
  HackerRankProfile,
  JobStatus,
  JobMatchResult,
  LeetCodeProfile,
  Paginated,
  Readiness,
  ResumeAnalysis,
  SkillProofScore,
  SkillVerification,
  StudentProfile,
  StudentRoadmap
} from "@/lib/types";

const user = {
  id: "mock-user",
  name: "Demo Student",
  email: "student1@placemate.ai",
  role: "STUDENT" as const
};

const drive: Drive = {
  id: "mock-drive",
  company: { id: "mock-company", name: "Amazon", industry: "Technology" },
  role: "SDE Intern",
  description: "Mock drive for fast local development.",
  stipend: 80000,
  location: "Bengaluru",
  jobType: "INTERNSHIP_PPO",
  eligibleBranches: ["CSE", "IT"],
  minimumCgpa: 8,
  maxBacklogs: 0,
  requiredSkills: ["DSA", "Java", "AWS"],
  applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
  status: "OPEN",
  _count: { applications: 12 }
};

const profile: StudentProfile = {
  id: "mock-profile",
  user,
  phone: "9876543210",
  collegeName: "Nexus Institute of Technology",
  branch: "CSE",
  year: 4,
  graduationYear: 2027,
  cgpa: 8.4,
  activeBacklogs: 0,
  location: "Pune",
  targetRole: "Software Engineer",
  preferredCompanies: ["Amazon", "Infosys"],
  preferredLocation: "Bengaluru",
  expectedSalary: 900000,
  placementStatus: "OPEN_TO_APPLY",
  githubUsername: "demo-dev",
  leetcodeUsername: "demo-codes",
  hackerrankUsername: "demo-hr",
  resumeUrl: "/uploads/demo-resume.pdf",
  readinessScore: 82,
  skills: [
    { id: "skill-1", name: "Java", category: "Programming", level: 4 },
    { id: "skill-2", name: "React", category: "Frontend", level: 4 },
    { id: "skill-3", name: "SQL", category: "Database", level: 4 },
    { id: "skill-4", name: "DSA", category: "Coding", level: 3 }
  ],
  projects: [
    {
      id: "project-1",
      title: "Placement Tracker",
      description: "Full-stack placement dashboard with analytics.",
      techStack: ["React", "NestJS", "PostgreSQL"],
      githubUrl: "https://github.com/demo/placement-tracker",
      liveUrl: "https://example.com"
    }
  ],
  education: [{ id: "edu-1", degree: "B.Tech", institute: "Nexus Institute", startYear: 2023, endYear: 2027, score: "8.4 CGPA" }]
};

const skillProof: SkillProofScore = {
  id: "mock-skillproof",
  overallScore: 78,
  level: "Placement Ready",
  placementReadinessScore: 82,
  resumeScore: 76,
  githubScore: 80,
  leetcodeScore: 72,
  hackerRankScore: 68,
  projectScore: 84,
  skillVerificationScore: 78,
  breakdownJson: {},
  suggestionsJson: ["Add stronger AWS project proof", "Solve 20 graph and DP problems", "Add quantified resume impact"],
  calculatedAt: new Date().toISOString()
};

let mockResumeJob: JobStatus | null = null;

export async function mockApiFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const method = options.method ?? "GET";

  if (path === "/auth/me") return { ...user, studentProfile: { id: profile.id, readinessScore: profile.readinessScore, placementStatus: profile.placementStatus } } as T;
  if (path === "/students/me") return profile as T;
  if (path === "/students/me/readiness") {
    return { score: 82, level: "Highly Ready", breakdown: { profile: 88, resume: 76, skills: 84, projects: 86, codingProfiles: 72 }, suggestions: ["Improve AWS proof", "Add one deployed backend project"] } satisfies Readiness as T;
  }
  if (path.startsWith("/drives")) return { items: [drive], total: 1, page: 1, limit: 50 } satisfies Paginated<Drive> as T;
  if (path === "/applications/me") return [] satisfies Application[] as T;
  if (path === "/skillproof/me" || (path === "/skillproof/calculate" && method === "POST")) return skillProof as T;
  if (path === "/skillproof/verification") {
    return [
      { id: "v1", skillName: "React", proofLevel: "Strong Proof", confidenceScore: 90, suggestion: "Strong verified signal" },
      { id: "v2", skillName: "AWS", proofLevel: "Weak Proof", confidenceScore: 40, suggestion: "Add cloud deployment proof" }
    ] satisfies SkillVerification[] as T;
  }
  if (path === "/integrations/github/me") {
    return {
      id: "gh",
      username: "demo-dev",
      publicRepos: 8,
      followers: 12,
      following: 20,
      githubScore: 80,
      strengthsJson: ["Good recent project activity", "Repository documentation is visible"],
      suggestionsJson: ["Add live demos to top projects"],
      lastSyncedAt: new Date().toISOString(),
      repositories: [
        { id: "repo", name: "placement-tracker", description: "Placement dashboard", stars: 4, forks: 1, openIssues: 0, hasReadme: true, hasLiveDemo: true, qualityScore: 84, primaryLanguage: "TypeScript" }
      ]
    } satisfies GitHubProfile as T;
  }
  if (path === "/integrations/leetcode/me") return { id: "lc", username: "demo-codes", totalSolved: 180, easySolved: 85, mediumSolved: 80, hardSolved: 15, leetcodeScore: 72, topicStatsJson: { Arrays: 40, Trees: 25, Graphs: 18, DP: 12 }, suggestionsJson: ["Attempt weekly contests"] } satisfies LeetCodeProfile as T;
  if (path === "/integrations/hackerrank/me") return { id: "hr", username: "demo-hr", problemSolvingScore: 70, pythonScore: 78, javaScore: 72, sqlScore: 74, hackerRankScore: 68, suggestionsJson: ["Complete SQL certification"] } satisfies HackerRankProfile as T;
  if (path === "/ai/resume/latest") return { id: "resume", resumeScore: 76, atsScore: 81, projectsScore: 18, impactScore: 7, contactScore: 10, educationScore: 10, skillsScore: 15, experienceScore: 6, formattingScore: 8, linksScore: 5, detectedSkillsJson: ["Java", "React", "SQL"], suggestionsJson: ["Add measurable impact"], analyzedAt: new Date().toISOString() } satisfies ResumeAnalysis as T;
  if (path === "/ai/resume/analyze" && method === "POST") {
    const now = new Date().toISOString();
    mockResumeJob = { id: "mock-resume-job", type: "resume-analysis", status: "queued", progress: 10, createdAt: now, updatedAt: now };
    setTimeout(() => {
      const doneAt = new Date().toISOString();
      mockResumeJob = { id: "mock-resume-job", type: "resume-analysis", status: "completed", progress: 100, createdAt: now, updatedAt: doneAt };
    }, 600);
    return mockResumeJob as T;
  }
  if (path.startsWith("/jobs/")) {
    return (mockResumeJob ?? { id: path.split("/").pop() ?? "mock-job", type: "resume-analysis", status: "completed", progress: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }) as T;
  }
  if (path.startsWith("/matches/drive/")) return { id: "match", studentProfileId: profile.id, driveId: drive.id, matchScore: 76, matchedSkillsJson: ["Java", "DSA"], missingSkillsJson: ["AWS"], suggestionsJson: ["Build one AWS deployment proof"], calculatedAt: new Date().toISOString(), drive } satisfies JobMatchResult as T;
  if (path === "/roadmaps/me") return [] satisfies StudentRoadmap[] as T;
  if (path.startsWith("/tpo/dashboard")) return { cards: { totalStudents: 120, totalDrives: 8, openDrives: 4, totalApplications: 240, shortlistedStudents: 36, selectedStudents: 12, averageReadinessScore: 72, averageSkillProofScore: 70, strongGithubStudents: 28, strongLeetCodeStudents: 22, weakResumeStudents: 16, weakDsaStudents: 18 }, charts: { branchWiseStudents: [{ branch: "CSE", students: 60 }], driveWiseApplications: [{ drive: "Amazon SDE", applications: 45 }] } } as T;
  if (path.startsWith("/tpo/reports/top-students")) return [{ id: profile.id, name: user.name, branch: profile.branch, cgpa: profile.cgpa, readinessScore: 82, skillProofScore: 78, githubScore: 80, leetcodeScore: 72, resumeScore: 76 }] as T;
  if (path.startsWith("/tpo/reports/skill-gap")) return { mostMissingSkills: [{ name: "AWS", count: 18 }], suggestedTrainingSessions: ["Run an AWS basics workshop"], companyWiseGaps: [] } as T;
  if (path.startsWith("/tpo/reports/weak-skills")) return { weakSkills: [{ name: "AWS", count: 18 }], students: [] } as T;
  if (path.startsWith("/tpo/reports/company-fit") || path.startsWith("/matches/drive/")) return { drive, students: [{ ...profile, match: { matchScore: 76, missingSkillsJson: ["AWS"] }, eligibility: { status: "ELIGIBLE" } }] } as T;

  return {} as T;
}
