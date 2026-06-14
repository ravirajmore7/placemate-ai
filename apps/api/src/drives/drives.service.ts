import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDriveDto } from "./dto/create-drive.dto";
import { UpdateDriveDto } from "./dto/update-drive.dto";
import { checkEligibility } from "./eligibility";

@Injectable()
export class DrivesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 12), 1), 50);
    const skip = (page - 1) * limit;
    const where: Prisma.DriveWhereInput = {};

    if (query.status) {
      where.status = query.status as never;
    }

    if (query.search) {
      where.OR = [
        { role: { contains: query.search, mode: "insensitive" } },
        { company: { name: { contains: query.search, mode: "insensitive" } } }
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.drive.findMany({
        where,
        skip,
        take: limit,
        orderBy: { applicationDeadline: "asc" },
        include: { company: true, _count: { select: { applications: true } } }
      }),
      this.prisma.drive.count({ where })
    ]);

    return { items, total, page, limit };
  }

  async getById(id: string) {
    const drive = await this.prisma.drive.findUnique({
      where: { id },
      include: {
        company: true,
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { applications: true } }
      }
    });

    if (!drive) {
      throw new NotFoundException("Drive not found");
    }

    return drive;
  }

  async create(createdById: string, dto: CreateDriveDto) {
    const company = await this.prisma.company.upsert({
      where: { name: dto.companyName },
      create: {
        name: dto.companyName,
        website: dto.companyWebsite,
        industry: dto.industry,
        description: dto.companyDescription
      },
      update: {
        website: dto.companyWebsite,
        industry: dto.industry,
        description: dto.companyDescription
      }
    });

    return this.prisma.drive.create({
      data: {
        companyId: company.id,
        createdById,
        role: dto.role,
        description: dto.description,
        ctc: dto.ctc,
        stipend: dto.stipend,
        location: dto.location,
        jobType: dto.jobType,
        eligibleBranches: dto.eligibleBranches,
        minimumCgpa: dto.minimumCgpa,
        maxBacklogs: dto.maxBacklogs,
        requiredSkills: dto.requiredSkills,
        applicationDeadline: new Date(dto.applicationDeadline),
        testDate: dto.testDate ? new Date(dto.testDate) : undefined,
        interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : undefined,
        status: dto.status ?? "OPEN"
      },
      include: { company: true }
    });
  }

  async update(id: string, dto: UpdateDriveDto) {
    await this.getById(id);
    let companyId: string | undefined;

    if (dto.companyName) {
      const company = await this.prisma.company.upsert({
        where: { name: dto.companyName },
        create: {
          name: dto.companyName,
          website: dto.companyWebsite,
          industry: dto.industry,
          description: dto.companyDescription
        },
        update: {
          website: dto.companyWebsite,
          industry: dto.industry,
          description: dto.companyDescription
        }
      });
      companyId = company.id;
    }

    return this.prisma.drive.update({
      where: { id },
      data: {
        companyId,
        role: dto.role,
        description: dto.description,
        ctc: dto.ctc,
        stipend: dto.stipend,
        location: dto.location,
        jobType: dto.jobType,
        eligibleBranches: dto.eligibleBranches,
        minimumCgpa: dto.minimumCgpa,
        maxBacklogs: dto.maxBacklogs,
        requiredSkills: dto.requiredSkills,
        applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : undefined,
        testDate: dto.testDate ? new Date(dto.testDate) : undefined,
        interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : undefined,
        status: dto.status
      },
      include: { company: true }
    });
  }

  async delete(id: string) {
    await this.getById(id);
    await this.prisma.drive.delete({ where: { id } });
    return { ok: true };
  }

  async eligibilityForUser(userId: string, driveId: string) {
    const [student, drive] = await Promise.all([
      this.prisma.studentProfile.findUnique({ where: { userId }, include: { skills: true } }),
      this.prisma.drive.findUnique({ where: { id: driveId } })
    ]);

    if (!student) {
      throw new NotFoundException("Student profile not found");
    }

    if (!drive) {
      throw new NotFoundException("Drive not found");
    }

    return checkEligibility(student, drive);
  }

  async eligibilityForProfile(studentProfileId: string, driveId: string) {
    const [student, drive] = await Promise.all([
      this.prisma.studentProfile.findUnique({ where: { id: studentProfileId }, include: { skills: true } }),
      this.prisma.drive.findUnique({ where: { id: driveId } })
    ]);

    if (!student || !drive) {
      throw new NotFoundException("Student or drive not found");
    }

    return checkEligibility(student, drive);
  }
}
