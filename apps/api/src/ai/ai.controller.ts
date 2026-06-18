import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AiService } from "./ai.service";

@Controller("ai")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post("mentor/chat")
  @Roles(Role.STUDENT)
  mentorChat(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.ai.mentorChat(user, body);
  }

  @Get("mentor/history")
  @Roles(Role.STUDENT)
  mentorHistory(@CurrentUser() user: AuthUser) {
    return this.ai.mentorHistory(user);
  }

  @Post("resume-builder/generate")
  @Roles(Role.STUDENT)
  resumeBuilder(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.ai.generateResume(user, body);
  }

  @Post("mock-interview/start")
  @Roles(Role.STUDENT)
  startInterview(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.ai.startMockInterview(user, body);
  }

  @Post("mock-interview/evaluate")
  @Roles(Role.STUDENT)
  evaluateInterview(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.ai.evaluateMockInterview(user, body);
  }

  @Get("prediction/me")
  @Roles(Role.STUDENT)
  placementPrediction(@CurrentUser() user: AuthUser) {
    return this.ai.placementPrediction(user);
  }

  @Post("match")
  @Roles(Role.RECRUITER, Role.COMPANY_ADMIN, Role.TPO_ADMIN, Role.SUPER_ADMIN)
  matchCandidates(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.ai.matchCandidates(user, body);
  }

  @Post("search")
  @Roles(Role.RECRUITER, Role.COMPANY_ADMIN, Role.TPO_ADMIN, Role.SUPER_ADMIN)
  semanticSearch(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.ai.semanticTalentSearch(user, body);
  }

  @Post("roadmap/generate")
  @Roles(Role.STUDENT, Role.TPO_ADMIN, Role.SUPER_ADMIN)
  generateRoadmap(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.ai.generateRoadmap(user, body);
  }

  @Post("skill-gap/analyze")
  @Roles(Role.STUDENT, Role.TPO_ADMIN, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  skillGap(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.ai.skillGapAnalysis(user, body);
  }

  @Post("recruiter-copilot/ask")
  @Roles(Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  recruiterCopilot(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.ai.recruiterCopilot(user, body);
  }

  @Post("tpo-copilot/ask")
  @Roles(Role.TPO_ADMIN, Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  tpoCopilot(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.ai.tpoCopilot(user, body);
  }

  @Post("portfolio/generate")
  @Roles(Role.STUDENT)
  portfolio(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.ai.generatePortfolio(user, body);
  }

  @Get("admin/dashboard")
  @Roles(Role.SUPER_ADMIN)
  adminDashboard(@Query() query: Record<string, string | undefined>) {
    return this.ai.adminDashboard(query);
  }

  @Get("vector/status")
  @Roles(Role.RECRUITER, Role.COMPANY_ADMIN, Role.TPO_ADMIN, Role.SUPER_ADMIN)
  vectorStatus() {
    return this.ai.vectorStatus();
  }
}
