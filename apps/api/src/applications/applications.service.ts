import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ApplicationStatus, EligibilityStatus, Prisma } from "@prisma/client";
import { DrivesService } from "../drives/drives.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly drives: DrivesService
  ) {}

  async create(userId: string, dto: CreateApplicationDto) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Student profile not found");
    }

    const eligibility = await this.drives.eligibilityForProfile(profile.id, dto.driveId);
    const status = dto.status ?? ApplicationStatus.APPLIED;

    if (status !== ApplicationStatus.SAVED && eligibility.status === EligibilityStatus.NOT_ELIGIBLE) {
      throw new BadRequestException(eligibility.reason);
    }

    try {
      return await this.prisma.application.create({
        data: {
          studentProfileId: profile.id,
          driveId: dto.driveId,
          status,
          eligibilityStatus: eligibility.status,
          eligibilityReason: eligibility.reason
        },
        include: {
          drive: { include: { company: true } },
          studentProfile: { include: { user: { select: { id: true, name: true, email: true } } } }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException("You have already applied or saved this drive");
      }
      throw error;
    }
  }

  async listMine(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Student profile not found");
    }

    return this.prisma.application.findMany({
      where: { studentProfileId: profile.id },
      orderBy: { updatedAt: "desc" },
      include: { drive: { include: { company: true } } }
    });
  }

  async listAll(query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;
    const where: Prisma.ApplicationWhereInput = {};

    if (query.status) {
      where.status = query.status as ApplicationStatus;
    }

    if (query.driveId) {
      where.driveId = query.driveId;
    }

    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          drive: { include: { company: true } },
          studentProfile: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              skills: true
            }
          }
        }
      }),
      this.prisma.application.count({ where })
    ]);

    return { items, total, page, limit };
  }

  async updateStatus(id: string, dto: UpdateApplicationStatusDto) {
    const existing = await this.prisma.application.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Application not found");
    }

    return this.prisma.application.update({
      where: { id },
      data: { status: dto.status },
      include: {
        drive: { include: { company: true } },
        studentProfile: { include: { user: { select: { id: true, name: true, email: true } } } }
      }
    });
  }
}
