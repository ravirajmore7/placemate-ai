import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { TpoService } from "./tpo.service";

@Controller("tpo")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TPO_ADMIN, Role.SUPER_ADMIN)
export class TpoController {
  constructor(private readonly tpo: TpoService) {}

  @Get("dashboard")
  dashboard() {
    return this.tpo.dashboard();
  }

  @Get("students")
  students(@Query() query: Record<string, string | undefined>) {
    return this.tpo.students(query);
  }

  @Get("students/:id")
  student(@Param("id") id: string) {
    return this.tpo.student(id);
  }

  @Get("drives/:id/eligible-students")
  eligibleStudents(@Param("id") id: string) {
    return this.tpo.eligibleStudents(id);
  }

  @Get("reports")
  reports() {
    return this.tpo.reports();
  }
}
