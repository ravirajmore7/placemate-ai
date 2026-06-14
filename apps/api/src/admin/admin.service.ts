import { Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [totalUsers, totalStudents, totalTpoAdmins, totalDrives, totalApplications, usersByRole] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: Role.STUDENT } }),
        this.prisma.user.count({ where: { role: Role.TPO_ADMIN } }),
        this.prisma.drive.count(),
        this.prisma.application.count(),
        this.prisma.user.groupBy({ by: ["role"], _count: { role: true } })
      ]);

    return {
      totalUsers,
      totalStudents,
      totalTpoAdmins,
      totalDrives,
      totalApplications,
      usersByRole: usersByRole.map((item) => ({ role: item.role, users: item._count.role }))
    };
  }

  async users() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        studentProfile: { select: { id: true, readinessScore: true, branch: true, collegeName: true } }
      }
    });
  }
}
