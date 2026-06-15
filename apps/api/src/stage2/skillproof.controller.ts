import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Stage2Service } from "./stage2.service";

@Controller("skillproof")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class SkillProofController {
  constructor(private readonly stage2: Stage2Service) {}

  @Post("calculate")
  calculate(@CurrentUser() user: AuthUser) {
    return this.stage2.calculateSkillProofForUser(user.id);
  }

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.stage2.skillProofMe(user.id);
  }

  @Get("history")
  history(@CurrentUser() user: AuthUser) {
    return this.stage2.skillProofHistory(user.id);
  }

  @Get("verification")
  verification(@CurrentUser() user: AuthUser) {
    return this.stage2.skillVerification(user.id);
  }
}
