import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AssessmentsService } from "./assessments.service";

@Controller("assessments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Get()
  @Roles(Role.STUDENT, Role.TPO_ADMIN, Role.COLLEGE_ADMIN, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  list(@Query() query: Record<string, string | undefined>) {
    return this.assessments.list(query);
  }

  @Post()
  @Roles(Role.TPO_ADMIN, Role.COLLEGE_ADMIN, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.assessments.create(user, body);
  }

  @Get(":id")
  @Roles(Role.STUDENT, Role.TPO_ADMIN, Role.COLLEGE_ADMIN, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  get(@Param("id") id: string) {
    return this.assessments.get(id);
  }

  @Post(":id/start")
  @Roles(Role.STUDENT)
  start(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.assessments.start(user, id);
  }

  @Post("attempts/:id/submit")
  @Roles(Role.STUDENT)
  submit(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.assessments.submit(user, id, body);
  }

  @Get(":id/leaderboard")
  @Roles(Role.STUDENT, Role.TPO_ADMIN, Role.COLLEGE_ADMIN, Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  leaderboard(@Param("id") id: string) {
    return this.assessments.leaderboard(id);
  }
}
