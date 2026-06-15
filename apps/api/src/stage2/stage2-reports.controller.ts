import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Stage2Service } from "./stage2.service";

@Controller("tpo/reports")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TPO_ADMIN, Role.SUPER_ADMIN)
export class Stage2ReportsController {
  constructor(private readonly stage2: Stage2Service) {}

  @Get("skill-gap")
  skillGap() {
    return this.stage2.tpoSkillGapReport();
  }

  @Get("top-students")
  topStudents() {
    return this.stage2.tpoTopStudents();
  }

  @Get("company-fit/:driveId")
  companyFit(@Param("driveId") driveId: string) {
    return this.stage2.tpoCompanyFitReport(driveId);
  }

  @Get("weak-skills")
  weakSkills() {
    return this.stage2.tpoWeakSkillsReport();
  }

  @Get("platform-readiness")
  platformReadiness() {
    return this.stage2.tpoPlatformReadiness();
  }
}
