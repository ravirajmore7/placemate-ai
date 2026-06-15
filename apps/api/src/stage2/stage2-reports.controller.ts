import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
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
  skillGap(@Query() query: Record<string, string | undefined>) {
    return this.stage2.tpoSkillGapReport(query);
  }

  @Get("top-students")
  topStudents(@Query() query: Record<string, string | undefined>) {
    return this.stage2.tpoTopStudents(query);
  }

  @Get("company-fit/:driveId")
  companyFit(@Param("driveId") driveId: string, @Query() query: Record<string, string | undefined>) {
    return this.stage2.tpoCompanyFitReport(driveId, query);
  }

  @Get("weak-skills")
  weakSkills(@Query() query: Record<string, string | undefined>) {
    return this.stage2.tpoWeakSkillsReport(query);
  }

  @Get("platform-readiness")
  platformReadiness() {
    return this.stage2.tpoPlatformReadiness();
  }
}
