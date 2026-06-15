import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { JobAnalyzeDto, ResumeAnalyzeDto, TextAnalyzeDto } from "./dto/stage2.dto";
import { Stage2Service } from "./stage2.service";

@Controller("ai")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiStage2Controller {
  constructor(private readonly stage2: Stage2Service) {}

  @Post("resume/analyze")
  @Roles(Role.STUDENT)
  analyzeResume(@CurrentUser() user: AuthUser, @Body() dto: ResumeAnalyzeDto) {
    return this.stage2.queueResumeAnalysis(user.id, dto);
  }

  @Get("resume/latest")
  @Roles(Role.STUDENT)
  latestResume(@CurrentUser() user: AuthUser) {
    return this.stage2.latestResume(user.id);
  }

  @Get("resume/score")
  @Roles(Role.STUDENT)
  resumeScore(@CurrentUser() user: AuthUser) {
    return this.stage2.resumeScore(user.id);
  }

  @Post("extract-skills")
  @Roles(Role.STUDENT, Role.TPO_ADMIN, Role.SUPER_ADMIN)
  extractSkills(@Body() dto: TextAnalyzeDto) {
    return this.stage2.extractSkills(dto.text);
  }

  @Post("jobs/:driveId/analyze")
  @Roles(Role.TPO_ADMIN, Role.SUPER_ADMIN)
  analyzeJob(@Param("driveId") driveId: string, @Body() dto: JobAnalyzeDto) {
    return this.stage2.analyzeJobDescription(driveId, dto);
  }

  @Get("jobs/:driveId/analysis")
  @Roles(Role.STUDENT, Role.TPO_ADMIN, Role.SUPER_ADMIN)
  jobAnalysis(@Param("driveId") driveId: string) {
    return this.stage2.getJobAnalysis(driveId);
  }
}
