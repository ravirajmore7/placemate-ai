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
