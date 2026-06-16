import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Stage3Service } from "./stage3.service";

@Controller("recruiter")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
export class RecruiterController {
  constructor(private readonly stage3: Stage3Service) {}

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.stage3.recruiterMe(user);
  }

  @Put("me")
  updateMe(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.updateRecruiterMe(user, body);
  }

  @Get("dashboard")
  dashboard(@CurrentUser() user: AuthUser) {
    return this.stage3.recruiterDashboard(user);
  }

  @Post("jobs")
  createJob(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.createRecruiterJob(user, body);
  }

  @Get("jobs")
  jobs(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.stage3.recruiterJobs(user, query);
  }

  @Get("jobs/:id")
  job(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.stage3.recruiterJob(user, id);
  }

  @Put("jobs/:id")
  updateJob(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.stage3.updateRecruiterJob(user, id, body);
  }

  @Delete("jobs/:id")
  deleteJob(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.stage3.deleteRecruiterJob(user, id);
  }

  @Put("jobs/:id/status")
  updateJobStatus(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.stage3.setRecruiterJobStatus(user, id, body);
  }

  @Get("jobs/:jobId/applications")
  jobApplications(@CurrentUser() user: AuthUser, @Param("jobId") jobId: string) {
    return this.stage3.recruiterJobApplications(user, jobId);
  }

  @Get("candidates")
  candidates(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.stage3.candidates(user, query);
  }

  @Get("candidates/:studentId")
  candidate(@CurrentUser() user: AuthUser, @Param("studentId") studentId: string, @Query() query: Record<string, string | undefined>) {
    return this.stage3.candidate(user, studentId, query);
  }

  @Post("candidates/:studentId/view")
  viewCandidate(@CurrentUser() user: AuthUser, @Param("studentId") studentId: string, @Body() body: Record<string, unknown>) {
    return this.stage3.recordCandidateView(user, studentId, body);
  }

  @Post("candidates/:studentId/shortlist")
  shortlist(@CurrentUser() user: AuthUser, @Param("studentId") studentId: string, @Body() body: Record<string, unknown>) {
    return this.stage3.shortlistCandidate(user, studentId, body);
  }

  @Put("shortlists/:id/status")
  shortlistStatus(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.stage3.updateShortlistStatus(user, id, body);
  }

  @Get("shortlists")
  shortlists(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.stage3.shortlists(user, query);
  }

  @Post("candidates/:studentId/contact-request")
  contact(@CurrentUser() user: AuthUser, @Param("studentId") studentId: string, @Body() body: Record<string, unknown>) {
    return this.stage3.contactRequest(user, studentId, body);
  }

  @Get("applications")
  applications(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.stage3.recruiterApplications(user, query);
  }

  @Put("applications/:id/status")
  updateApplicationStatus(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.stage3.updateRecruiterApplicationStatus(user, id, body);
  }
}
