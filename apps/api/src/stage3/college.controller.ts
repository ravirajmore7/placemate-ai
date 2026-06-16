import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Stage3Service } from "./stage3.service";

@Controller("college")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COLLEGE_ADMIN, Role.TPO_ADMIN, Role.SUPER_ADMIN)
export class CollegeController {
  constructor(private readonly stage3: Stage3Service) {}

  @Post("onboarding")
  onboarding(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.collegeOnboarding(user, body);
  }

  @Get("settings")
  settings(@CurrentUser() user: AuthUser) {
    return this.stage3.collegeSettings(user);
  }

  @Put("settings")
  updateSettings(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.updateCollegeSettings(user, body);
  }

  @Get("team")
  team(@CurrentUser() user: AuthUser) {
    return this.stage3.collegeTeam(user);
  }

  @Post("team/invite")
  invite(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.inviteCollegeMember(user, body);
  }

  @Get("billing")
  billing(@CurrentUser() user: AuthUser) {
    return this.stage3.billing(user);
  }
}
