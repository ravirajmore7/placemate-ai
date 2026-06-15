import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { HackerRankCsvDto, HackerRankManualDto, LeetCodeManualDto, UsernameSyncDto } from "./dto/stage2.dto";
import { Stage2Service } from "./stage2.service";

@Controller("integrations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsController {
  constructor(private readonly stage2: Stage2Service) {}

  @Post("github/sync")
  @Roles(Role.STUDENT)
  syncGitHub(@CurrentUser() user: AuthUser, @Body() dto: UsernameSyncDto) {
    return this.stage2.syncGitHub(user.id, dto);
  }

  @Get("github/me")
  @Roles(Role.STUDENT)
  getGitHub(@CurrentUser() user: AuthUser) {
    return this.stage2.getGitHubMe(user.id);
  }

  @Get("github/repositories")
  @Roles(Role.STUDENT)
  async getRepositories(@CurrentUser() user: AuthUser) {
    const profile = await this.stage2.getGitHubMe(user.id);
    return profile?.repositories ?? [];
  }

  @Get("github/score")
  @Roles(Role.STUDENT)
  getGitHubScore(@CurrentUser() user: AuthUser) {
    return this.stage2.getGitHubScore(user.id);
  }

  @Post("leetcode/sync")
  @Roles(Role.STUDENT)
  syncLeetCode(@CurrentUser() user: AuthUser, @Body() dto: UsernameSyncDto) {
    return this.stage2.syncLeetCode(user.id, dto);
  }

  @Post("leetcode/manual")
  @Roles(Role.STUDENT)
  saveLeetCodeManual(@CurrentUser() user: AuthUser, @Body() dto: LeetCodeManualDto) {
    return this.stage2.saveLeetCodeManual(user.id, dto);
  }

  @Get("leetcode/me")
  @Roles(Role.STUDENT)
  getLeetCode(@CurrentUser() user: AuthUser) {
    return this.stage2.getLeetCodeMe(user.id);
  }

  @Get("leetcode/score")
  @Roles(Role.STUDENT)
  getLeetCodeScore(@CurrentUser() user: AuthUser) {
    return this.stage2.getLeetCodeScore(user.id);
  }

  @Post("hackerrank/sync")
  @Roles(Role.STUDENT)
  syncHackerRank(@CurrentUser() user: AuthUser, @Body() dto: UsernameSyncDto) {
    return this.stage2.syncHackerRank(user.id, dto);
  }

  @Post("hackerrank/manual")
  @Roles(Role.STUDENT)
  saveHackerRankManual(@CurrentUser() user: AuthUser, @Body() dto: HackerRankManualDto) {
    return this.stage2.saveHackerRankManual(user.id, dto);
  }

  @Post("hackerrank/upload-csv")
  @Roles(Role.TPO_ADMIN, Role.SUPER_ADMIN)
  uploadHackerRankCsv(@Body() dto: HackerRankCsvDto) {
    return this.stage2.uploadHackerRankCsv(dto);
  }

  @Get("hackerrank/me")
  @Roles(Role.STUDENT)
  getHackerRank(@CurrentUser() user: AuthUser) {
    return this.stage2.getHackerRankMe(user.id);
  }

  @Get("hackerrank/score")
  @Roles(Role.STUDENT)
  getHackerRankScore(@CurrentUser() user: AuthUser) {
    return this.stage2.getHackerRankScore(user.id);
  }
}
