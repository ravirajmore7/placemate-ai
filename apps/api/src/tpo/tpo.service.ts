import { Injectable, NotFoundException } from "@nestjs/common";
import { ApplicationStatus, EligibilityStatus, PlacementStatus, Prisma } from "@prisma/client";
import { checkEligibility } from "../drives/eligibility";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TpoService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [
      totalStudents,
      totalDrives,
      openDrives,
      totalApplications,
      shortlistedStudents,
      selectedStudents,
      readinessAggregate,
      skillProofAggregate,
      strongGithubStudents,
      strongLeetCodeStudents,
      weakResumeStudents,
      weakDsaStudents,
      branchWise,
      driveWise
    ] = await Promise.all([
      this.prisma.studentProfile.count(),
      this.prisma.drive.count(),
      this.prisma.drive.count({ where: { status: "OPEN" } }),
      this.prisma.application.count(),
      this.prisma.application.count({ where: { status: "SHORTLISTED" } }),
      this.prisma.application.count({ where: { status: "SELECTED" } }),
      this.prisma.studentProfile.aggregate({ _avg: { readinessScore: true } }),
      this.prisma.skillProofScore.aggregate({ _avg: { overallScore: true } }),
      this.prisma.gitHubProfile.count({ where: { githubScore: { gte: 75 } } }),
      this.prisma.leetCodeProfile.count({ where: { leetcodeScore: { gte: 75 } } }),
      this.prisma.resumeAnalysis.count({ where: { resumeScore: { lt: 60 } } }),
      this.prisma.skillVerification.count({
        where: {
          skillName: { in: ["DSA", "Data Structures", "Algorithms", "Dynamic Programming", "Graphs"] },
          confidenceScore: { lt: 60 }
        }
      }),
      this.prisma.studentProfile.groupBy({ by: ["branch"], _count: { branch: true } }),
      this.prisma.drive.findMany({
        include: { company: true, _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
        take: 8
      })
    ]);

    return {
      cards: {
        totalStudents,
        totalDrives,
        openDrives,
        totalApplications,
        shortlistedStudents,
        selectedStudents,
        averageReadinessScore: Math.round(readinessAggregate._avg.readinessScore ?? 0),
        averageSkillProofScore: Math.round(skillProofAggregate._avg.overallScore ?? 0),
        strongGithubStudents,
        strongLeetCodeStudents,
        weakResumeStudents,
        weakDsaStudents
      },
      charts: {
        branchWiseStudents: branchWise.map((item) => ({
          branch: item.branch || "Not added",
          students: item._count.branch
        })),
        driveWiseApplications: driveWise.map((drive) => ({
          drive: `${drive.company.name} ${drive.role}`,
          applications: drive._count.applications
        }))
      }
    };
  }

  async students(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;
    const where: Prisma.StudentProfileWhereInput = {};

    if (query.branch) where.branch = query.branch;
    if (query.minCgpa) where.cgpa = { gte: Number(query.minCgpa) };
    if (query.maxBacklogs) where.activeBacklogs = { lte: Number(query.maxBacklogs) };
    if (query.minReadiness) where.readinessScore = { gte: Number(query.minReadiness) };
    if (query.placementStatus) where.placementStatus = query.placementStatus as PlacementStatus;
    if (query.skills) {
      const skills = query.skills.split(",").map((skill) => skill.trim()).filter(Boolean);
      where.skills = {
        some: {
          OR: skills.map((skill) => ({ name: { contains: skill, mode: "insensitive" } }))
        }
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { readinessScore: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          skills: true,
          projects: true,
          applications: { include: { drive: { include: { company: true } } } }
        }
      }),
      this.prisma.studentProfile.count({ where })
    ]);

    return { items, total, page, limit };
  }

  async student(id: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        skills: true,
        projects: true,
        education: true,
        applications: { include: { drive: { include: { company: true } } } },
        codingProfileSnapshots: true
      }
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    return student;
  }

  async eligibleStudents(driveId: string) {
    const drive = await this.prisma.drive.findUnique({ where: { id: driveId }, include: { company: true } });
    if (!drive) {
      throw new NotFoundException("Drive not found");
    }

    const students = await this.prisma.studentProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        skills: true,
        applications: { where: { driveId } }
      },
      orderBy: { readinessScore: "desc" }
    });

    return {
      drive,
      students: students
        .map((student) => ({
          ...student,
          eligibility: checkEligibility(student, drive)
        }))
        .filter((student) => student.eligibility.status !== EligibilityStatus.NOT_ELIGIBLE)
    };
  }

  async reports() {
    const [applications, students, drives] = await Promise.all([
      this.prisma.application.groupBy({ by: ["status"], _count: { status: true } }),
      this.prisma.studentProfile.findMany({ select: { readinessScore: true, branch: true, placementStatus: true } }),
      this.prisma.drive.findMany({ include: { company: true, _count: { select: { applications: true } } } })
    ]);

    const buckets = [
      { label: "0-40", min: 0, max: 40 },
      { label: "41-60", min: 41, max: 60 },
      { label: "61-80", min: 61, max: 80 },
      { label: "81-100", min: 81, max: 100 }
    ];

    return {
      applicationsByStatus: applications.map((item) => ({
        status: item.status,
        count: item._count.status
      })),
      readinessDistribution: buckets.map((bucket) => ({
        bucket: bucket.label,
        students: students.filter((student) => student.readinessScore >= bucket.min && student.readinessScore <= bucket.max).length
      })),
      placementStatus: Object.values(PlacementStatus).map((status) => ({
        status,
        students: students.filter((student) => student.placementStatus === status).length
      })),
      drivePerformance: drives.map((drive) => ({
        drive: `${drive.company.name} ${drive.role}`,
        applications: drive._count.applications
      }))
    };
  }
}
