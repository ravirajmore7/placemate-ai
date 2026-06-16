import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Stage3Service } from "./stage3.service";

@Controller("student")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class StudentStage3Controller {
  constructor(private readonly stage3: Stage3Service) {}

  @Get("recruiter-jobs")
  jobs(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.stage3.publicRecruiterJobs(user, query);
  }

  @Get("recruiter-jobs/:id")
  job(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.stage3.publicRecruiterJob(user, id);
  }

  @Post("recruiter-jobs/:id/apply")
  apply(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.stage3.applyRecruiterJob(user, id);
  }

  @Get("recruiter-invites")
  invites(@CurrentUser() user: AuthUser) {
    return this.stage3.studentInvites(user);
  }

  @Get("contact-requests")
  contactRequests(@CurrentUser() user: AuthUser) {
    return this.stage3.studentContactRequests(user);
  }

  @Put("contact-requests/:id/respond")
  respond(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.stage3.respondContactRequest(user, id, body);
  }

  @Get("visibility")
  visibility(@CurrentUser() user: AuthUser) {
    return this.stage3.studentVisibility(user);
  }

  @Put("visibility")
  updateVisibility(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.updateStudentVisibility(user, body);
  }
}
