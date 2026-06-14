import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CodingProfilesDto } from "./dto/coding-profiles.dto";
import { EducationDto } from "./dto/education.dto";
import { ProjectDto } from "./dto/project.dto";
import { ResumeDto } from "./dto/resume.dto";
import { SkillDto } from "./dto/skill.dto";
import { UpdateStudentProfileDto } from "./dto/update-student-profile.dto";
import { StudentsService } from "./students.service";

@Controller("students")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get("me")
  @Roles(Role.STUDENT)
  me(@CurrentUser() user: AuthUser) {
    return this.students.getMyProfile(user.id);
  }

  @Put("me")
  @Roles(Role.STUDENT)
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateStudentProfileDto) {
    return this.students.updateMyProfile(user.id, dto);
  }

  @Get("me/readiness")
  @Roles(Role.STUDENT)
  readiness(@CurrentUser() user: AuthUser) {
    return this.students.getReadiness(user.id);
  }

  @Post("me/skills")
  @Roles(Role.STUDENT)
  addSkill(@CurrentUser() user: AuthUser, @Body() dto: SkillDto) {
    return this.students.addSkill(user.id, dto);
  }

  @Put("me/skills/:id")
  @Roles(Role.STUDENT)
  updateSkill(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: SkillDto) {
    return this.students.updateSkill(user.id, id, dto);
  }

  @Delete("me/skills/:id")
  @Roles(Role.STUDENT)
  deleteSkill(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.students.deleteSkill(user.id, id);
  }

  @Post("me/projects")
  @Roles(Role.STUDENT)
  addProject(@CurrentUser() user: AuthUser, @Body() dto: ProjectDto) {
    return this.students.addProject(user.id, dto);
  }

  @Put("me/projects/:id")
  @Roles(Role.STUDENT)
  updateProject(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ProjectDto) {
    return this.students.updateProject(user.id, id, dto);
  }

  @Delete("me/projects/:id")
  @Roles(Role.STUDENT)
  deleteProject(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.students.deleteProject(user.id, id);
  }

  @Post("me/education")
  @Roles(Role.STUDENT)
  addEducation(@CurrentUser() user: AuthUser, @Body() dto: EducationDto) {
    return this.students.addEducation(user.id, dto);
  }

  @Put("me/education/:id")
  @Roles(Role.STUDENT)
  updateEducation(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: EducationDto) {
    return this.students.updateEducation(user.id, id, dto);
  }

  @Delete("me/education/:id")
  @Roles(Role.STUDENT)
  deleteEducation(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.students.deleteEducation(user.id, id);
  }

  @Post("me/resume")
  @Roles(Role.STUDENT)
  resume(@CurrentUser() user: AuthUser, @Body() dto: ResumeDto) {
    return this.students.updateResume(user.id, dto);
  }

  @Post("me/coding-profiles")
  @Roles(Role.STUDENT)
  codingProfiles(@CurrentUser() user: AuthUser, @Body() dto: CodingProfilesDto) {
    return this.students.updateCodingProfiles(user.id, dto);
  }
}
