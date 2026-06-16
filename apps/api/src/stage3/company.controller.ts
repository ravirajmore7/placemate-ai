import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Stage3Service } from "./stage3.service";

@Controller("company")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RECRUITER, Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
export class CompanyController {
  constructor(private readonly stage3: Stage3Service) {}

  @Get("profile")
  profile(@CurrentUser() user: AuthUser) {
    return this.stage3.companyProfile(user);
  }

  @Put("profile")
  updateProfile(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.updateCompanyProfile(user, body);
  }

  @Get("team")
  team(@CurrentUser() user: AuthUser) {
    return this.stage3.companyTeam(user);
  }

  @Post("team/invite")
  invite(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.inviteCompanyMember(user, body);
  }

  @Delete("team/:memberId")
  remove(@CurrentUser() user: AuthUser, @Param("memberId") memberId: string) {
    return this.stage3.removeCompanyMember(user, memberId);
  }
}
