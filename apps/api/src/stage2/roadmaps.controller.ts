import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CompleteTaskDto, RoadmapGenerateDto } from "./dto/stage2.dto";
import { Stage2Service } from "./stage2.service";

@Controller("roadmaps")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoadmapsController {
  constructor(private readonly stage2: Stage2Service) {}

  @Post("generate")
  @Roles(Role.STUDENT)
  generate(@CurrentUser() user: AuthUser, @Body() dto: RoadmapGenerateDto) {
    return this.stage2.generateRoadmap(user.id, dto);
  }

  @Get("me")
  @Roles(Role.STUDENT)
  me(@CurrentUser() user: AuthUser) {
    return this.stage2.myRoadmaps(user.id);
  }

  @Get(":id")
  @Roles(Role.STUDENT, Role.TPO_ADMIN, Role.SUPER_ADMIN)
  getRoadmap(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.stage2.getRoadmap(user, id);
  }

  @Put("tasks/:taskId/complete")
  @Roles(Role.STUDENT)
  completeTask(@CurrentUser() user: AuthUser, @Param("taskId") taskId: string, @Body() dto: CompleteTaskDto) {
    return this.stage2.completeTask(user, taskId, dto.completed ?? true);
  }
}
