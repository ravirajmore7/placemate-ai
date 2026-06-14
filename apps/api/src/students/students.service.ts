import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CodingProfilesDto } from "./dto/coding-profiles.dto";
import { EducationDto } from "./dto/education.dto";
import { ProjectDto } from "./dto/project.dto";
import { ResumeDto } from "./dto/resume.dto";
import { SkillDto } from "./dto/skill.dto";
import { UpdateStudentProfileDto } from "./dto/update-student-profile.dto";
import { calculateReadiness, readinessJson } from "./readiness";

const profileInclude = {
  user: { select: { id: true, name: true, email: true, role: true } },
  skills: true,
  projects: true,
  education: true,
  applications: {
    include: {
      drive: {
        include: { company: true }
      }
    },
    orderBy: { updatedAt: "desc" as const }
  },
  codingProfileSnapshots: true
};

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    return this.prisma.studentProfile.findUnique({
      where: { id: profile.id },
      include: profileInclude
    });
  }

  async updateMyProfile(userId: string, dto: UpdateStudentProfileDto) {
    const profile = await this.ensureStudentProfile(userId);
    await this.prisma.studentProfile.update({
      where: { id: profile.id },
      data: dto
    });
    await this.refreshReadiness(profile.id);
    return this.getMyProfile(userId);
  }

  async getReadiness(userId: string) {
    const profile = await this.ensureStudentProfile(userId);
    return this.refreshReadiness(profile.id);
  }

  async addSkill(userId: string, dto: SkillDto) {
    const profile = await this.ensureStudentProfile(userId);
    const skill = await this.prisma.skill.create({
      data: { ...dto, studentProfileId: profile.id }
    });
    await this.refreshReadiness(profile.id);
    return skill;
  }

  async updateSkill(userId: string, id: string, dto: SkillDto) {
    const profile = await this.ensureStudentProfile(userId);
    await this.assertSkillOwner(profile.id, id);
    const skill = await this.prisma.skill.update({ where: { id }, data: dto });
    await this.refreshReadiness(profile.id);
    return skill;
  }

  async deleteSkill(userId: string, id: string) {
    const profile = await this.ensureStudentProfile(userId);
    await this.assertSkillOwner(profile.id, id);
    await this.prisma.skill.delete({ where: { id } });
    await this.refreshReadiness(profile.id);
    return { ok: true };
  }

  async addProject(userId: string, dto: ProjectDto) {
    const profile = await this.ensureStudentProfile(userId);
    const project = await this.prisma.project.create({
      data: {
        studentProfileId: profile.id,
        title: dto.title,
        description: dto.description,
        techStack: dto.techStack,
        githubUrl: dto.githubUrl,
        liveUrl: dto.liveUrl,
        category: dto.category,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined
      }
    });
    await this.refreshReadiness(profile.id);
    return project;
  }

  async updateProject(userId: string, id: string, dto: ProjectDto) {
    const profile = await this.ensureStudentProfile(userId);
    await this.assertProjectOwner(profile.id, id);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null
      }
    });
    await this.refreshReadiness(profile.id);
    return project;
  }

  async deleteProject(userId: string, id: string) {
    const profile = await this.ensureStudentProfile(userId);
    await this.assertProjectOwner(profile.id, id);
    await this.prisma.project.delete({ where: { id } });
    await this.refreshReadiness(profile.id);
    return { ok: true };
  }

  async addEducation(userId: string, dto: EducationDto) {
    const profile = await this.ensureStudentProfile(userId);
    return this.prisma.education.create({
      data: { ...dto, studentProfileId: profile.id }
    });
  }

  async updateEducation(userId: string, id: string, dto: EducationDto) {
    const profile = await this.ensureStudentProfile(userId);
    await this.assertEducationOwner(profile.id, id);
    return this.prisma.education.update({ where: { id }, data: dto });
  }

  async deleteEducation(userId: string, id: string) {
    const profile = await this.ensureStudentProfile(userId);
    await this.assertEducationOwner(profile.id, id);
    await this.prisma.education.delete({ where: { id } });
    return { ok: true };
  }

  async updateResume(userId: string, dto: ResumeDto) {
    const profile = await this.ensureStudentProfile(userId);
    await this.prisma.studentProfile.update({ where: { id: profile.id }, data: { resumeUrl: dto.resumeUrl } });
    return this.refreshReadiness(profile.id);
  }

  async updateCodingProfiles(userId: string, dto: CodingProfilesDto) {
    const profile = await this.ensureStudentProfile(userId);
    await this.prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        githubUsername: dto.githubUsername,
        leetcodeUsername: dto.leetcodeUsername,
        hackerrankUsername: dto.hackerrankUsername
      }
    });

    const snapshots = [
      ["GitHub", dto.githubUsername],
      ["LeetCode", dto.leetcodeUsername],
      ["HackerRank", dto.hackerrankUsername]
    ].filter((entry): entry is [string, string] => Boolean(entry[1]));

    for (const [platform, username] of snapshots) {
      await this.prisma.codingProfileSnapshot.upsert({
        where: { studentProfileId_platform: { studentProfileId: profile.id, platform } },
        create: {
          studentProfileId: profile.id,
          platform,
          username,
          publicStatsJson: { source: "placeholder", syncedBy: "stage-1" }
        },
        update: {
          username,
          lastSyncedAt: new Date(),
          publicStatsJson: { source: "placeholder", syncedBy: "stage-1" }
        }
      });
    }

    return this.refreshReadiness(profile.id);
  }

  async ensureStudentProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException("Only student accounts have a placement profile");
    }

    if (user.studentProfile) {
      return user.studentProfile;
    }

    return this.prisma.studentProfile.create({
      data: { userId, collegeName: "" }
    });
  }

  async refreshReadiness(studentProfileId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: { skills: true, projects: true }
    });

    if (!profile) {
      throw new NotFoundException("Student profile not found");
    }

    const result = calculateReadiness(profile);
    await this.prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: { readinessScore: result.score }
    });

    await this.prisma.readinessScoreHistory.create({
      data: {
        studentProfileId,
        score: result.score,
        ...readinessJson(result)
      }
    });

    return result;
  }

  private async assertSkillOwner(studentProfileId: string, id: string) {
    const row = await this.prisma.skill.findFirst({ where: { id, studentProfileId } });
    if (!row) throw new NotFoundException("Skill not found");
  }

  private async assertProjectOwner(studentProfileId: string, id: string) {
    const row = await this.prisma.project.findFirst({ where: { id, studentProfileId } });
    if (!row) throw new NotFoundException("Project not found");
  }

  private async assertEducationOwner(studentProfileId: string, id: string) {
    const row = await this.prisma.education.findFirst({ where: { id, studentProfileId } });
    if (!row) throw new NotFoundException("Education entry not found");
  }
}
