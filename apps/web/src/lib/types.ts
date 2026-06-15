export type Role = "STUDENT" | "TPO_ADMIN" | "COLLEGE_ADMIN" | "RECRUITER" | "SUPER_ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Skill = {
  id: string;
  name: string;
  category: string;
  level: number;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  category?: string;
};

export type Education = {
  id: string;
  degree: string;
  institute: string;
  startYear: number;
  endYear?: number;
  score?: string;
};

export type StudentProfile = {
  id: string;
  user: User;
  phone?: string;
  collegeName?: string;
  branch?: string;
  year?: number;
  graduationYear?: number;
  cgpa?: number;
  activeBacklogs: number;
  location?: string;
  targetRole?: string;
  preferredCompanies: string[];
  preferredLocation?: string;
  expectedSalary?: number;
  placementStatus: string;
  githubUsername?: string;
  leetcodeUsername?: string;
  hackerrankUsername?: string;
  resumeUrl?: string;
  readinessScore: number;
  skills: Skill[];
  projects: Project[];
  education: Education[];
  applications?: Application[];
  codingProfileSnapshots?: Array<Record<string, unknown>>;
};

export type Company = {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  description?: string;
};

export type Drive = {
  id: string;
  company: Company;
  role: string;
  description: string;
  ctc?: number;
  stipend?: number;
  location: string;
  jobType: string;
  eligibleBranches: string[];
  minimumCgpa: number;
  maxBacklogs: number;
  requiredSkills: string[];
  applicationDeadline: string;
  testDate?: string;
  interviewDate?: string;
  status: string;
  _count?: { applications: number };
};

export type Application = {
  id: string;
  status: string;
  eligibilityStatus: string;
  eligibilityReason: string;
  appliedAt: string;
  updatedAt: string;
  drive: Drive;
  studentProfile?: StudentProfile;
};

export type Readiness = {
  score: number;
  level: string;
  breakdown: Record<string, number>;
  suggestions: string[];
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type GitHubRepository = {
  id: string;
  name: string;
  description?: string;
  url?: string;
  primaryLanguage?: string;
  languagesJson?: string[];
  stars: number;
  forks: number;
  openIssues: number;
  hasReadme: boolean;
  hasLiveDemo: boolean;
  topicsJson?: string[];
  qualityScore: number;
  lastUpdatedAt?: string;
};

export type GitHubProfile = {
  id: string;
  username: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  profileUrl?: string;
  publicRepos: number;
  followers: number;
  following: number;
  githubScore: number;
  strengthsJson?: string[];
  weaknessesJson?: string[];
  suggestionsJson?: string[];
  lastSyncedAt?: string;
  repositories?: GitHubRepository[];
};

export type LeetCodeProfile = {
  id: string;
  username: string;
  profileUrl?: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking?: number;
  contestRating?: number;
  acceptanceRate?: number;
  badgesJson?: string[];
  topicStatsJson?: Record<string, number>;
  leetcodeScore: number;
  strengthsJson?: string[];
  weaknessesJson?: string[];
  suggestionsJson?: string[];
  lastSyncedAt?: string;
};

export type HackerRankProfile = {
  id: string;
  username: string;
  profileUrl?: string;
  problemSolvingScore: number;
  pythonScore: number;
  javaScore: number;
  sqlScore: number;
  certificationsJson?: string[];
  testScoresJson?: Array<Record<string, unknown>>;
  hackerRankScore: number;
  strengthsJson?: string[];
  weaknessesJson?: string[];
  suggestionsJson?: string[];
  lastSyncedAt?: string;
};

export type ResumeAnalysis = {
  id: string;
  resumeUrl?: string;
  extractedText?: string;
  detectedSkillsJson?: string[];
  missingSectionsJson?: string[];
  weakPointsJson?: string[];
  suggestionsJson?: string[];
  atsScore: number;
  resumeScore: number;
  contactScore: number;
  educationScore: number;
  skillsScore: number;
  projectsScore: number;
  experienceScore: number;
  formattingScore: number;
  impactScore: number;
  linksScore: number;
  analyzedAt: string;
};

export type SkillProofScore = {
  id: string;
  overallScore: number;
  level: string;
  placementReadinessScore: number;
  resumeScore: number;
  githubScore: number;
  leetcodeScore: number;
  hackerRankScore: number;
  projectScore: number;
  skillVerificationScore: number;
  breakdownJson?: Record<string, number>;
  suggestionsJson?: string[];
  calculatedAt: string;
};

export type SkillVerification = {
  id: string;
  skillName: string;
  proofLevel: string;
  sourcesJson?: Record<string, boolean>;
  confidenceScore: number;
  suggestion?: string;
};

export type JobMatchResult = {
  id: string;
  studentProfileId: string;
  driveId: string;
  matchScore: number;
  matchedSkillsJson?: string[];
  missingSkillsJson?: string[];
  weakSkillsJson?: string[];
  strongProofSkillsJson?: string[];
  reasonsJson?: string[];
  suggestionsJson?: string[];
  calculatedAt: string;
  drive?: Drive;
  studentProfile?: StudentProfile;
};

export type RoadmapTask = {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  dueDate?: string;
  completed: boolean;
};

export type StudentRoadmap = {
  id: string;
  title: string;
  durationDays: number;
  goal: string;
  status: string;
  roadmapJson?: Record<string, unknown>;
  drive?: Drive;
  tasks: RoadmapTask[];
};
