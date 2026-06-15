import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Stage2Service } from "./stage2.service";

@Controller("matches")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchesController {
  constructor(private readonly stage2: Stage2Service) {}

  @Post("drive/:driveId/calculate")
  @Roles(Role.STUDENT)
  calculateForDrive(@CurrentUser() user: AuthUser, @Param("driveId") driveId: string) {
    return this.stage2.matchDriveForUser(user.id, driveId);
  }

  @Get("drive/:driveId/me")
  @Roles(Role.STUDENT)
  myDriveMatch(@CurrentUser() user: AuthUser, @Param("driveId") driveId: string) {
    return this.stage2.matchDriveForUser(user.id, driveId);
  }

  @Get("student/:studentId")
  @Roles(Role.TPO_ADMIN, Role.SUPER_ADMIN)
  studentMatches(@Param("studentId") studentId: string) {
    return this.stage2.getStudentMatches(studentId);
  }

  @Get("drive/:driveId/recommended-students")
  @Roles(Role.TPO_ADMIN, Role.SUPER_ADMIN)
  recommendedStudents(@Param("driveId") driveId: string) {
    return this.stage2.recommendedStudents(driveId);
  }
}
