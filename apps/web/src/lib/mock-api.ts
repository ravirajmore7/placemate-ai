import type {
  Application,
  BillingOverview,
  CandidateSummary,
  Drive,
  GitHubProfile,
  HackerRankProfile,
  JobStatus,
  JobMatchResult,
  LeetCodeProfile,
  Organization,
  Paginated,
  Plan,
  Readiness,
  RecruiterJob,
  ResumeAnalysis,
  SkillProofScore,
  SkillVerification,
  StudentProfile,
  StudentRoadmap,
  Subscription
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

const mockOrganization: Organization = {
  id: "mock-company-org",
  name: "SkillForge Technologies",
  type: "company",
  website: "https://skillforge.example",
  industry: "SaaS",
  size: "51-200",
  location: "Bengaluru",
  status: "active",
  description: "Demo hiring company for recruiter portal testing."
};

const mockCollegeOrganization: Organization = {
  id: "mock-college-org",
  name: "Nexus Institute of Technology",
  type: "college",
  website: "https://nexus.example",
  industry: "Education",
  size: "3000 students",
  location: "Pune",
  status: "active",
  description: "Demo college tenant for SaaS admin testing."
};

const mockPlans: Plan[] = [
  { id: "plan-student-free", name: "Student Free", code: "free-student", audience: "student", description: "Core student placement profile.", priceMonthly: 0, priceYearly: 0, currency: "INR", featuresJson: ["Profile builder", "Readiness score", "Drive applications"], limitsJson: { resume_analyses: 2 }, active: true },
  { id: "plan-recruiter-pro", name: "Recruiter Pro", code: "recruiter-pro", audience: "recruiter", description: "Candidate discovery, jobs, shortlists, and contact requests.", priceMonthly: 99900, priceYearly: 999000, currency: "INR", featuresJson: ["10 active jobs", "Candidate search", "Shortlists", "Contact requests"], limitsJson: { job_posts: 10, candidate_views: 300, contact_requests: 80 }, active: true },
  { id: "plan-college-pro", name: "College Pro", code: "college-pro", audience: "college", description: "TPO dashboards, reports, billing, and team access.", priceMonthly: 499900, priceYearly: 4999000, currency: "INR", featuresJson: ["TPO analytics", "Reports", "Team seats", "Billing"], limitsJson: { student_profiles: 2000, drives: 50, reports: 100 }, active: true }
];

const mockUsage = {
  items: [
    { featureKey: "candidate_views", used: 42, limit: 300, remaining: 258 },
    { featureKey: "job_posts", used: 3, limit: 10, remaining: 7 },
    { featureKey: "contact_requests", used: 8, limit: 80, remaining: 72 }
  ]
};

const mockSubscription: Subscription = {
  id: "mock-subscription",
  organizationId: mockOrganization.id,
  planId: "plan-recruiter-pro",
  status: "trialing",
  billingCycle: "monthly",
  trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  cancelAtPeriodEnd: false,
  plan: mockPlans[1]
};

const mockBilling: BillingOverview = {
  subscription: mockSubscription,
  payments: [
    { id: "mock-payment", amount: 99900, currency: "INR", status: "paid", method: "upi", providerPaymentId: "pay_mock", providerOrderId: "order_mock", paidAt: new Date().toISOString(), createdAt: new Date().toISOString() }
  ],
  invoices: [
    { id: "mock-invoice", invoiceNumber: "INV-MOCK-001", amount: 99900, currency: "INR", status: "paid", issuedAt: new Date().toISOString(), paidAt: new Date().toISOString() }
  ],
  usage: mockUsage,
  paymentsConfigured: false
};

const recruiterJob: RecruiterJob = {
  id: "mock-recruiter-job",
  organizationId: mockOrganization.id,
  createdById: "mock-recruiter",
  title: "Backend Developer Intern",
  roleCategory: "Backend",
  jobType: "Internship",
  workMode: "Hybrid",
  location: "Bengaluru",
  ctc: 900000,
  stipend: 45000,
  experienceLevel: "Fresher",
  description: "Build APIs, background jobs, and analytics features for a SaaS product.",
  requiredSkillsJson: ["Node.js", "PostgreSQL", "React"],
  preferredSkillsJson: ["AWS", "Docker"],
  minimumCgpa: 7.5,
  allowedBranchesJson: ["CSE", "IT"],
  maxBacklogs: 0,
  hiringRoundsJson: ["Online assessment", "Technical interview", "HR"],
  openings: 4,
  deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
  visibility: "public",
  status: "open",
  organization: mockOrganization
};

const mockCandidate: CandidateSummary = {
  id: profile.id,
  name: user.name,
  collegeName: profile.collegeName,
  branch: profile.branch,
  graduationYear: profile.graduationYear,
  cgpa: profile.cgpa,
  location: profile.location,
  targetRole: profile.targetRole,
  placementStatus: profile.placementStatus,
  skills: profile.skills.map((skill) => skill.name),
  topProjects: profile.projects,
  skillProofScore: skillProof.overallScore,
  resumeScore: skillProof.resumeScore,
  githubScore: skillProof.githubScore,
  leetcodeScore: skillProof.leetcodeScore,
  hackerRankScore: skillProof.hackerRankScore,
  matchScore: 86,
  canContact: true,
  resumeVisible: true
};

let mockResumeJob: JobStatus | null = null;

export async function mockApiFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const method = options.method ?? "GET";
  const pathOnly = path.split("?")[0];

  if (path === "/auth/me") return { ...user, studentProfile: { id: profile.id, readinessScore: profile.readinessScore, placementStatus: profile.placementStatus } } as T;
  if (pathOnly === "/plans") return mockPlans as T;
  if (pathOnly.startsWith("/plans/")) return mockPlans.find((plan) => plan.code === pathOnly.split("/").pop()) as T;
  if (pathOnly === "/billing/current") return mockBilling as T;
  if (pathOnly === "/billing/create-subscription" && method === "POST") return { checkoutMode: "mock", subscription: mockSubscription } as T;
  if (pathOnly === "/payments/razorpay/verify" && method === "POST") return { ok: true, payment: mockBilling.payments[0] } as T;
  if (pathOnly === "/usage/current") return mockUsage as T;
  if (pathOnly === "/recruiter/dashboard") {
    return {
      cards: { activeJobs: 3, openApplications: 18, shortlists: 7, contactRequests: 8, profileViews: 42 },
      recentJobs: [recruiterJob],
      usage: mockUsage,
      subscription: mockSubscription
    } as T;
  }
  if (pathOnly === "/company/profile" && method === "PUT") return { ...mockOrganization, ...(options.body as Record<string, unknown>) } as T;
  if (pathOnly === "/company/profile") return mockOrganization as T;
  if (pathOnly === "/company/team") return { members: [{ id: "member-1", role: "COMPANY_ADMIN", user: { name: "Company Admin" } }, { id: "member-2", role: "RECRUITER", user: { name: "Demo Recruiter" } }], invitations: [] } as T;
  if (pathOnly === "/company/team/invite" && method === "POST") return { id: "invite-mock", status: "pending", ...(options.body as Record<string, unknown>) } as T;
  if (pathOnly === "/recruiter/jobs" && method === "POST") return { ...recruiterJob, id: `mock-job-${Date.now()}`, ...(options.body as Record<string, unknown>) } as T;
  if (pathOnly === "/recruiter/jobs") return { items: [recruiterJob], total: 1, page: 1, limit: 20 } satisfies Paginated<RecruiterJob> as T;
  if (pathOnly.endsWith("/applications") && pathOnly.startsWith("/recruiter/jobs/")) return { items: [{ id: "rec-app-1", status: "applied", student: mockCandidate, job: recruiterJob, appliedAt: new Date().toISOString() }] } as T;
  if (pathOnly.startsWith("/recruiter/jobs/")) return { ...recruiterJob, id: pathOnly.split("/").pop() ?? recruiterJob.id, applicationsCount: 12 } as T;
  if (pathOnly === "/recruiter/candidates") return { items: [mockCandidate], total: 1, page: 1, limit: 20 } satisfies Paginated<CandidateSummary> as T;
  if (pathOnly.endsWith("/view") || pathOnly.endsWith("/shortlist") || pathOnly.endsWith("/contact-request")) return { ok: true, id: "mock-action" } as T;
  if (pathOnly.startsWith("/recruiter/candidates/")) return { candidate: mockCandidate, profile, skillProof, latestResumeAnalysis: { resumeScore: 76, analyzedAt: new Date().toISOString() } } as T;
  if (pathOnly === "/recruiter/shortlists") return { items: [{ id: "shortlist-1", status: "shortlisted", student: mockCandidate, job: recruiterJob, createdAt: new Date().toISOString() }] } as T;
  if (pathOnly === "/recruiter/applications") return { items: [{ id: "rec-app-1", status: "applied", student: mockCandidate, job: recruiterJob, appliedAt: new Date().toISOString() }] } as T;
  if (pathOnly === "/student/recruiter-jobs") return { items: [recruiterJob], total: 1, page: 1, limit: 20 } satisfies Paginated<RecruiterJob> as T;
  if (pathOnly.endsWith("/apply") && pathOnly.startsWith("/student/recruiter-jobs/")) return { ok: true, status: "applied" } as T;
  if (pathOnly.startsWith("/student/recruiter-jobs/")) return { ...recruiterJob, applied: false } as T;
  if (pathOnly === "/student/recruiter-invites") return { items: [{ id: "invite-1", status: "invited", job: recruiterJob, organization: mockOrganization }] } as T;
  if (pathOnly === "/student/contact-requests") return { items: [{ id: "contact-1", status: "pending", message: "We would like to discuss an internship.", organization: mockOrganization }] } as T;
  if (pathOnly.startsWith("/student/contact-requests/") && pathOnly.endsWith("/respond")) return { ok: true, ...(options.body as Record<string, unknown>) } as T;
  if (pathOnly === "/student/visibility" && method === "PUT") return { ok: true, ...(options.body as Record<string, unknown>) } as T;
  if (pathOnly === "/student/visibility") return { visibility: "verified_recruiters", allowRecruiterContact: true, showEmail: false, showPhone: false, showResume: true, availabilityStatus: "available" } as T;
  if (pathOnly === "/college/onboarding" && method === "POST") return { organization: mockCollegeOrganization, subscription: { ...mockSubscription, organizationId: mockCollegeOrganization.id, plan: mockPlans[2] } } as T;
  if (pathOnly === "/college/settings") return mockCollegeOrganization as T;
  if (pathOnly === "/college/team") return { members: [{ id: "college-member-1", role: "COLLEGE_ADMIN", user: { name: "College Admin" } }, { id: "college-member-2", role: "TPO_ADMIN", user: { name: "TPO Admin" } }] } as T;
  if (pathOnly === "/admin/saas-dashboard") return { cards: { totalRevenue: 799800, monthlyRecurringRevenue: 599800, activeSubscriptions: 2, trialUsers: 1, totalColleges: 1, totalCompanies: 1, totalRecruiters: 2, failedPayments: 0 } } as T;
  if (pathOnly === "/admin/organizations") return { items: [mockCollegeOrganization, mockOrganization] } as T;
  if (pathOnly.startsWith("/admin/organizations/")) return { organization: mockOrganization, members: [{ id: "member-1", role: "COMPANY_ADMIN", user: { name: "Company Admin" } }], subscription: mockSubscription, payments: mockBilling.payments, logs: [] } as T;
  if (pathOnly === "/admin/subscriptions") return { items: [mockSubscription] } as T;
  if (pathOnly === "/admin/payments") return { items: mockBilling.payments } as T;
  if (pathOnly === "/admin/revenue") return { totalRevenue: 799800, revenueByMonth: [{ month: "2026-06", revenue: 799800 }], recentPayments: mockBilling.payments } as T;
  if (pathOnly === "/admin/account-logs") return { items: [{ id: "log-1", action: "activated", reason: "Demo tenant enabled", createdAt: new Date().toISOString() }] } as T;
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
