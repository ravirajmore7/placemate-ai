import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateDriveDto } from "./dto/create-drive.dto";
import { UpdateDriveDto } from "./dto/update-drive.dto";
import { DrivesService } from "./drives.service";

@Controller("drives")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DrivesController {
  constructor(private readonly drives: DrivesService) {}

  @Get()
  @Roles(Role.STUDENT, Role.TPO_ADMIN, Role.SUPER_ADMIN)
  list(@Query() query: Record<string, string | undefined>) {
    return this.drives.list(query);
  }

  @Get(":id")
  @Roles(Role.STUDENT, Role.TPO_ADMIN, Role.SUPER_ADMIN)
  getById(@Param("id") id: string) {
    return this.drives.getById(id);
  }

  @Post()
  @Roles(Role.TPO_ADMIN, Role.SUPER_ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDriveDto) {
    return this.drives.create(user.id, dto);
  }

  @Put(":id")
  @Roles(Role.TPO_ADMIN, Role.SUPER_ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateDriveDto) {
    return this.drives.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.TPO_ADMIN, Role.SUPER_ADMIN)
  delete(@Param("id") id: string) {
    return this.drives.delete(id);
  }

  @Get(":id/eligibility")
  @Roles(Role.STUDENT)
  eligibility(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.drives.eligibilityForUser(user.id, id);
  }
}
