import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new BadRequestException("An account with this email already exists");
    }

    const requestedRole = dto.role ?? Role.STUDENT;
    const role = requestedRole === Role.SUPER_ADMIN || requestedRole === Role.COLLEGE_ADMIN
      ? Role.STUDENT
      : requestedRole;

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        role,
        studentProfile: role === Role.STUDENT ? { create: { collegeName: "" } } : undefined
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    if (role === Role.RECRUITER || role === Role.COMPANY_ADMIN) {
      const organization = await this.prisma.organization.create({
        data: {
          name: role === Role.COMPANY_ADMIN ? `${dto.name}'s Company` : `${dto.name}'s Recruiting Team`,
          type: "COMPANY",
          status: "active",
          metadataJson: { source: "self_signup" }
        }
      });
      await this.prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role
        }
      });
      await this.prisma.recruiterProfile.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          fullName: dto.name,
          verified: role === Role.COMPANY_ADMIN
        }
      });
    }

    return {
      user,
      accessToken: this.signToken(user)
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return {
      user: safeUser,
      accessToken: this.signToken(safeUser)
    };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        studentProfile: { select: { id: true, readinessScore: true, placementStatus: true } }
      }
    });
  }

  private signToken(user: { id: string; email: string; role: string }) {
    return this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: this.config.get<string>("JWT_EXPIRES_IN") ?? "7d" }
    );
  }
}
