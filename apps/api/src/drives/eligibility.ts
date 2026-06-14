import { Drive, EligibilityStatus, StudentProfile } from "@prisma/client";

type StudentForEligibility = StudentProfile & {
  skills: { name: string }[];
};

type DriveForEligibility = Pick<
  Drive,
  "minimumCgpa" | "maxBacklogs" | "eligibleBranches" | "requiredSkills"
>;

export function checkEligibility(student: StudentForEligibility, drive: DriveForEligibility) {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const cgpa = student.cgpa ?? 0;
  const branch = student.branch ?? "";
  const studentSkills = new Set(student.skills.map((skill) => skill.name.toLowerCase()));
  const missingSkills = drive.requiredSkills.filter((skill) => !studentSkills.has(skill.toLowerCase()));

  if (cgpa < drive.minimumCgpa) {
    reasons.push(`Your CGPA is ${cgpa || "not added"} but required CGPA is ${drive.minimumCgpa}.`);
  }

  if (drive.eligibleBranches.length > 0 && !drive.eligibleBranches.includes(branch)) {
    reasons.push(`Your branch ${branch || "is not added"} is not in the eligible branch list.`);
  }

  if (student.activeBacklogs > drive.maxBacklogs) {
    reasons.push(`You have ${student.activeBacklogs} active backlog(s), but maximum allowed is ${drive.maxBacklogs}.`);
  }

  if (missingSkills.length > 0) {
    warnings.push(`Missing required skills: ${missingSkills.join(", ")}.`);
  }

  if (reasons.length > 0) {
    return {
      status: EligibilityStatus.NOT_ELIGIBLE,
      reason: reasons.join(" ")
    };
  }

  if (warnings.length > 0) {
    return {
      status: EligibilityStatus.PARTIALLY_READY,
      reason: `You are academically eligible, but ${warnings.join(" ")}`
    };
  }

  return {
    status: EligibilityStatus.ELIGIBLE,
    reason: "You meet CGPA, branch, backlog, and required skill requirements."
  };
}
