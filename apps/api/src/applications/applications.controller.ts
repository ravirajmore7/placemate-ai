import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { ApplicationsService } from "./applications.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";

@Controller("applications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post()
  @Roles(Role.STUDENT)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateApplicationDto) {
    return this.applications.create(user.id, dto);
  }

  @Get("me")
  @Roles(Role.STUDENT)
  mine(@CurrentUser() user: AuthUser) {
    return this.applications.listMine(user.id);
  }

  @Get()
  @Roles(Role.TPO_ADMIN, Role.SUPER_ADMIN)
  all(@Query() query: Record<string, string | undefined>) {
    return this.applications.listAll(query);
  }

  @Put(":id/status")
  @Roles(Role.TPO_ADMIN, Role.SUPER_ADMIN)
  updateStatus(@Param("id") id: string, @Body() dto: UpdateApplicationStatusDto) {
    return this.applications.updateStatus(id, dto);
  }
}
