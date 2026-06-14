export const ROLES = [
  "STUDENT",
  "TPO_ADMIN",
  "COLLEGE_ADMIN",
  "RECRUITER",
  "SUPER_ADMIN"
] as const;

export type Role = (typeof ROLES)[number];

export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "SHORTLISTED",
  "TEST_SCHEDULED",
  "TEST_COMPLETED",
  "INTERVIEW_SCHEDULED",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN"
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const READINESS_LEVELS = {
  NOT_READY: "Not Ready",
  BASIC_READY: "Basic Ready",
  PLACEMENT_READY: "Placement Ready",
  HIGHLY_READY: "Highly Ready"
} as const;

export function readinessLevel(score: number) {
  if (score <= 40) return READINESS_LEVELS.NOT_READY;
  if (score <= 60) return READINESS_LEVELS.BASIC_READY;
  if (score <= 80) return READINESS_LEVELS.PLACEMENT_READY;
  return READINESS_LEVELS.HIGHLY_READY;
}
