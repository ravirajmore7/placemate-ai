import { Prisma, StudentProfile } from "@prisma/client";

type ProfileForReadiness = StudentProfile & {
  skills: { id: string; name: string; category: string; level: number }[];
  projects: { id: string }[];
};

export type ReadinessResult = {
  score: number;
  level: "Not Ready" | "Basic Ready" | "Placement Ready" | "Highly Ready";
  breakdown: {
    profile: number;
    resume: number;
    skills: number;
    projects: number;
    codingProfiles: number;
    cgpa: number;
    backlogs: number;
  };
  suggestions: string[];
};

export function getReadinessLevel(score: number): ReadinessResult["level"] {
  if (score <= 40) return "Not Ready";
  if (score <= 60) return "Basic Ready";
  if (score <= 80) return "Placement Ready";
  return "Highly Ready";
}

export function calculateReadiness(profile: ProfileForReadiness): ReadinessResult {
  const profileFields = [
    profile.phone,
    profile.collegeName,
    profile.branch,
    profile.year,
    profile.graduationYear,
    profile.cgpa,
    profile.location,
    profile.targetRole,
    profile.preferredLocation,
    profile.expectedSalary,
    profile.preferredCompanies.length > 0
  ];

  const completedFields = profileFields.filter(Boolean).length;
  const profileScore = Math.round((completedFields / profileFields.length) * 20);
  const resumeScore = profile.resumeUrl ? 15 : 0;
  const skillsScore = Math.min(15, Math.round((profile.skills.length / 5) * 15));
  const projectsScore = profile.projects.length >= 2 ? 20 : profile.projects.length === 1 ? 10 : 0;
  const codingProfilesScore =
    (profile.githubUsername ? 5 : 0) +
    (profile.leetcodeUsername ? 5 : 0) +
    (profile.hackerrankUsername ? 5 : 0);
  const cgpaScore = profile.cgpa == null ? 0 : profile.cgpa >= 7 ? 10 : profile.cgpa >= 6 ? 6 : 3;
  const backlogScore = profile.activeBacklogs === 0 ? 5 : profile.activeBacklogs === 1 ? 2 : 0;

  const breakdown = {
    profile: profileScore,
    resume: resumeScore,
    skills: skillsScore,
    projects: projectsScore,
    codingProfiles: codingProfilesScore,
    cgpa: cgpaScore,
    backlogs: backlogScore
  };

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const suggestions: string[] = [];

  if (profileScore < 18) suggestions.push("Complete personal, academic, and career fields in your placement profile.");
  if (!profile.resumeUrl) suggestions.push("Upload or link your latest resume to improve your readiness score.");
  if (profile.skills.length < 5) suggestions.push("Add at least 5 relevant technical and soft skills.");
  if (profile.projects.length < 2) suggestions.push("Add at least 2 projects with tech stack, GitHub, and live links.");
  if (!profile.githubUsername || !profile.leetcodeUsername) suggestions.push("Add GitHub and LeetCode usernames for stronger skill proof.");
  if ((profile.cgpa ?? 0) < 7) suggestions.push("Target drives with matching CGPA criteria and keep improving academics.");
  if (profile.activeBacklogs > 0) suggestions.push("Clear active backlogs to unlock more company drives.");

  return {
    score,
    level: getReadinessLevel(score),
    breakdown,
    suggestions
  };
}

export const readinessJson = (result: ReadinessResult) => ({
  breakdownJson: result.breakdown as unknown as Prisma.InputJsonValue,
  suggestionsJson: result.suggestions as unknown as Prisma.InputJsonValue
});
