import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, Role } from "@prisma/client";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

const json = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

type AuthLikeUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type Query = Record<string, string | undefined>;

type BillingContext = {
  organizationId?: string | null;
  userId?: string | null;
};

type UsageCheck = {
  allowed: boolean;
  featureKey: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  message?: string;
};

const CONTACT_SALES_LIMIT = -1;
const COMPANY_ADMIN_ROLES = [Role.COMPANY_ADMIN, Role.SUPER_ADMIN] as string[];
const COMPANY_ROLES = [Role.RECRUITER, Role.COMPANY_ADMIN] as string[];
const COLLEGE_ADMIN_ROLES = [Role.COLLEGE_ADMIN, Role.SUPER_ADMIN] as string[];
const COLLEGE_ROLES = [Role.COLLEGE_ADMIN, Role.TPO_ADMIN] as string[];

@Injectable()
export class Stage3Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async plans(query: Query = {}) {
    const where: Prisma.PlanWhereInput = { active: true };
    if (query.audience) where.audience = query.audience.toUpperCase();
    return this.prisma.plan.findMany({ where, orderBy: [{ audience: "asc" }, { priceMonthly: "asc" }] });
  }

  async plan(code: string) {
    const plan = await this.prisma.plan.findUnique({ where: { code } });
    if (!plan) throw new NotFoundException("Plan not found");
    return plan;
  }

  async recruiterMe(user: AuthLikeUser) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    const profile = await this.prisma.recruiterProfile.findUnique({ where: { userId: user.id } });
    const subscription = await this.currentSubscription({ organizationId: organization.id });
    return { user, organization, profile, subscription };
  }

  async updateRecruiterMe(user: AuthLikeUser, body: Record<string, unknown>) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    return this.prisma.recruiterProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        organizationId: organization.id,
        fullName: String(body.fullName ?? user.name),
        designation: this.optionalString(body.designation),
        phone: this.optionalString(body.phone),
        linkedinUrl: this.optionalString(body.linkedinUrl),
        verified: user.role === Role.COMPANY_ADMIN
      },
      update: {
        fullName: this.optionalString(body.fullName) ?? user.name,
        designation: this.optionalString(body.designation),
        phone: this.optionalString(body.phone),
        linkedinUrl: this.optionalString(body.linkedinUrl)
      }
    });
  }

  async recruiterDashboard(user: AuthLikeUser) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    const [activeJobs, jobs, applications, shortlists, interviews, candidateViews, subscription, recentActivity, recommendedCandidates] =
      await Promise.all([
        this.prisma.recruiterJob.count({ where: { organizationId: organization.id, status: "open" } }),
        this.prisma.recruiterJob.findMany({ where: { organizationId: organization.id }, orderBy: { createdAt: "desc" }, take: 5 }),
        this.prisma.recruiterApplication.count({ where: { recruiterJobId: { in: await this.jobIdsForOrganization(organization.id) } } }),
        this.prisma.candidateShortlist.count({ where: { organizationId: organization.id, status: { in: ["saved", "shortlisted", "interview", "offered"] } } }),
        this.prisma.candidateShortlist.count({ where: { organizationId: organization.id, status: "interview" } }),
        this.usageForFeature(organization.id, "candidate_views"),
        this.currentSubscription({ organizationId: organization.id }),
        this.activityForOrganization(organization.id),
        this.candidates(user, { limit: "4", minSkillProof: "60" })
      ]);

    const usage = await this.usageSummary(user);
    return {
      organization,
      cards: {
        activeJobs,
        totalApplications: applications,
        shortlistedCandidates: shortlists,
        interviewsScheduled: interviews,
        candidateViewsUsed: candidateViews,
        jobPostsUsed: usage.items.find((item) => item.featureKey === "job_posts")?.used ?? 0,
        currentPlan: subscription?.plan?.name ?? "No active plan"
      },
      usage,
      activeJobsList: jobs,
      recommendedCandidates: recommendedCandidates.items,
      recentActivity
    };
  }

  async companyProfile(user: AuthLikeUser) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    const team = await this.companyTeam(user);
    const subscription = await this.currentSubscription({ organizationId: organization.id });
    return { ...organization, teamMembers: team.members, subscription };
  }

  async updateCompanyProfile(user: AuthLikeUser, body: Record<string, unknown>) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    if (!COMPANY_ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException("Only company admins can update the company profile");
    }
    return this.prisma.organization.update({
      where: { id: organization.id },
      data: {
        name: this.optionalString(body.name) ?? organization.name,
        website: this.optionalString(body.website),
        logoUrl: this.optionalString(body.logoUrl),
        industry: this.optionalString(body.industry),
        size: this.optionalString(body.size),
        location: this.optionalString(body.location),
        description: this.optionalString(body.description),
        metadataJson: json({
          headquarters: body.headquarters ?? organization.location,
          linkedInUrl: body.linkedInUrl,
          careersPageUrl: body.careersPageUrl,
          contactEmail: body.contactEmail
        })
      }
    });
  }

  async companyTeam(user: AuthLikeUser) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId: organization.id, status: { not: "disabled" } },
      orderBy: { createdAt: "asc" }
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: members.map((member) => member.userId) } },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    const byId = new Map(users.map((item) => [item.id, item]));
    return { organization, members: members.map((member) => ({ ...member, user: byId.get(member.userId) })) };
  }

  async inviteCompanyMember(user: AuthLikeUser, body: Record<string, unknown>) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    if (!COMPANY_ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException("Only company admins can invite recruiters");
    }
    const role = String(body.role ?? Role.RECRUITER) as Role;
    if (!COMPANY_ROLES.includes(role)) throw new BadRequestException("Invalid company role");
    return this.createInvitation(organization.id, user.id, String(body.email ?? ""), role);
  }

  async removeCompanyMember(user: AuthLikeUser, memberId: string) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    if (!COMPANY_ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException("Only company admins can remove team members");
    }
    await this.prisma.organizationMember.updateMany({
      where: { id: memberId, organizationId: organization.id },
      data: { status: "disabled" }
    });
    return { ok: true };
  }

  async createRecruiterJob(user: AuthLikeUser, body: Record<string, unknown>) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    await this.assertUsageAvailable(organization.id, user.id, "job_posts", 1, "You have reached your monthly job posting limit. Upgrade your plan to post more jobs.");
    const created = await this.prisma.recruiterJob.create({
      data: this.jobData(organization.id, user.id, body)
    });
    await this.incrementUsage({ organizationId: organization.id, userId: user.id, featureKey: "job_posts", count: 1, metadata: { jobId: created.id } });
    return created;
  }

  async recruiterJobs(user: AuthLikeUser, query: Query = {}) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    const page = this.page(query);
    const limit = this.limit(query, 20, 100);
    const where: Prisma.RecruiterJobWhereInput = { organizationId: organization.id };
    if (query.status) where.status = query.status;
    if (query.search) where.title = { contains: query.search, mode: "insensitive" };
    const [items, total] = await Promise.all([
      this.prisma.recruiterJob.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.recruiterJob.count({ where })
    ]);
    return { items, total, page, limit };
  }

  async recruiterJob(user: AuthLikeUser, id: string) {
    const job = await this.assertRecruiterJobAccess(user, id);
    const applications = await this.prisma.recruiterApplication.count({ where: { recruiterJobId: id } });
    return { ...job, applicationsCount: applications };
  }

  async updateRecruiterJob(user: AuthLikeUser, id: string, body: Record<string, unknown>) {
    const job = await this.assertRecruiterJobAccess(user, id);
    return this.prisma.recruiterJob.update({
      where: { id },
      data: {
        ...this.jobData(job.organizationId, job.createdById, { ...job, ...body }),
        createdAt: undefined
      }
    });
  }

  async deleteRecruiterJob(user: AuthLikeUser, id: string) {
    await this.assertRecruiterJobAccess(user, id);
    await this.prisma.recruiterJob.delete({ where: { id } });
    return { ok: true };
  }

  async setRecruiterJobStatus(user: AuthLikeUser, id: string, body: Record<string, unknown>) {
    await this.assertRecruiterJobAccess(user, id);
    return this.prisma.recruiterJob.update({ where: { id }, data: { status: String(body.status ?? "draft").toLowerCase() } });
  }

  async candidates(user: AuthLikeUser, query: Query = {}) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    await this.assertOrganizationActive(organization.id);
    const page = this.page(query);
    const limit = this.limit(query, 12, 50);
    const visibility = await this.prisma.studentVisibilitySetting.findMany({
      where: { visibility: { in: ["verified_recruiters", "public"] } },
      select: { studentProfileId: true, showEmail: true, showPhone: true, showResume: true, allowRecruiterContact: true }
    });
    const visibleIds = visibility.map((item) => item.studentProfileId);
    if (!visibleIds.length) return { items: [], total: 0, page, limit };

    const where: Prisma.StudentProfileWhereInput = { id: { in: visibleIds } };
    if (query.branch) where.branch = query.branch;
    if (query.college) where.collegeName = { contains: query.college, mode: "insensitive" };
    if (query.graduationYear) where.graduationYear = Number(query.graduationYear);
    if (query.minCgpa) where.cgpa = { gte: Number(query.minCgpa) };
    if (query.location) where.location = { contains: query.location, mode: "insensitive" };
    if (query.placementStatus) where.placementStatus = query.placementStatus as never;
    if (query.skills) {
      const skills = query.skills.split(",").map((skill) => skill.trim()).filter(Boolean);
      where.skills = { some: { OR: skills.map((skill) => ({ name: { contains: skill, mode: "insensitive" } })) } };
    }

    const [students, total] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { readinessScore: "desc" },
        include: this.candidateInclude()
      }),
      this.prisma.studentProfile.count({ where })
    ]);

    const minSkillProof = Number(query.minSkillProof ?? 0);
    const items = (students as any[])
      .map((student) => this.candidateSummary(student, visibility.find((item) => item.studentProfileId === student.id), query.jobId))
      .filter((student) => student.skillProofScore >= minSkillProof);
    return { items, total, page, limit, organization };
  }

  async candidate(user: AuthLikeUser, studentId: string, query: Query = {}) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    const setting = await this.requireRecruiterVisibility(studentId);
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: this.candidateInclude(true)
    });
    if (!student) throw new NotFoundException("Candidate not found");
    const contactApproved = await this.prisma.contactRequest.findFirst({
      where: { organizationId: organization.id, studentProfileId: studentId, status: "accepted" }
    });
    const candidate = student as any;
    return {
      ...this.candidateSummary(candidate, setting, query.jobId),
      education: candidate.education,
      projects: candidate.projects,
      showContact: Boolean(contactApproved),
      email: contactApproved && setting.showEmail ? candidate.user.email : undefined,
      phone: contactApproved && setting.showPhone ? candidate.phone : undefined,
      resumeUrl: setting.showResume ? candidate.resumeUrl : undefined,
      skillVerifications: candidate.skillVerifications.slice(0, 12)
    };
  }

  async recordCandidateView(user: AuthLikeUser, studentId: string, body: Record<string, unknown>) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    await this.requireRecruiterVisibility(studentId);
    await this.assertUsageAvailable(organization.id, user.id, "candidate_views", 1, "You have reached your candidate view limit for this month.");
    const view = await this.prisma.candidateView.create({
      data: {
        recruiterId: user.id,
        organizationId: organization.id,
        studentProfileId: studentId,
        recruiterJobId: this.optionalString(body.recruiterJobId)
      }
    });
    await this.incrementUsage({ organizationId: organization.id, userId: user.id, featureKey: "candidate_views", count: 1, metadata: { studentProfileId: studentId } });
    return view;
  }

  async shortlistCandidate(user: AuthLikeUser, studentId: string, body: Record<string, unknown>) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    await this.requireRecruiterVisibility(studentId);
    const recruiterJobId = this.optionalString(body.recruiterJobId);
    if (recruiterJobId) await this.assertRecruiterJobAccess(user, recruiterJobId);
    const existing = await this.prisma.candidateShortlist.findFirst({
      where: { organizationId: organization.id, studentProfileId: studentId, recruiterJobId: recruiterJobId ?? null }
    });
    if (existing) {
      return this.prisma.candidateShortlist.update({
        where: { id: existing.id },
        data: {
          status: String(body.status ?? existing.status).toLowerCase(),
          rating: body.rating === undefined ? existing.rating : Number(body.rating),
          notes: this.optionalString(body.notes) ?? existing.notes
        }
      });
    }
    return this.prisma.candidateShortlist.create({
      data: {
        recruiterId: user.id,
        organizationId: organization.id,
        studentProfileId: studentId,
        recruiterJobId,
        status: String(body.status ?? "saved").toLowerCase(),
        rating: body.rating === undefined ? undefined : Number(body.rating),
        notes: this.optionalString(body.notes)
      }
    });
  }

  async updateShortlistStatus(user: AuthLikeUser, id: string, body: Record<string, unknown>) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    const shortlist = await this.prisma.candidateShortlist.findFirst({ where: { id, organizationId: organization.id } });
    if (!shortlist) throw new NotFoundException("Shortlist item not found");
    return this.prisma.candidateShortlist.update({
      where: { id },
      data: {
        status: String(body.status ?? shortlist.status).toLowerCase(),
        rating: body.rating === undefined ? shortlist.rating : Number(body.rating),
        notes: body.notes === undefined ? shortlist.notes : this.optionalString(body.notes),
        interviewDate: body.interviewDate ? new Date(String(body.interviewDate)) : shortlist.interviewDate
      }
    });
  }

  async shortlists(user: AuthLikeUser, query: Query = {}) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    const where: Prisma.CandidateShortlistWhereInput = { organizationId: organization.id };
    if (query.status) where.status = query.status;
    const items = await this.prisma.candidateShortlist.findMany({ where, orderBy: { updatedAt: "desc" }, take: this.limit(query, 50, 100) });
    return { items: await this.attachStudentsToShortlists(items) };
  }

  async contactRequest(user: AuthLikeUser, studentId: string, body: Record<string, unknown>) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    const setting = await this.requireRecruiterVisibility(studentId);
    if (!setting.allowRecruiterContact) throw new BadRequestException("Candidate is not accepting recruiter contact requests");
    return this.prisma.contactRequest.create({
      data: {
        recruiterId: user.id,
        organizationId: organization.id,
        studentProfileId: studentId,
        recruiterJobId: this.optionalString(body.recruiterJobId),
        message: this.optionalString(body.message)
      }
    });
  }

  async recruiterApplications(user: AuthLikeUser, query: Query = {}) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    const jobIds = await this.jobIdsForOrganization(organization.id);
    const where: Prisma.RecruiterApplicationWhereInput = { recruiterJobId: { in: jobIds } };
    if (query.status) where.status = query.status;
    const items = await this.prisma.recruiterApplication.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: this.limit(query, 50, 100)
    });
    return { items: await this.attachApplications(items) };
  }

  async recruiterJobApplications(user: AuthLikeUser, jobId: string) {
    await this.assertRecruiterJobAccess(user, jobId);
    const items = await this.prisma.recruiterApplication.findMany({ where: { recruiterJobId: jobId }, orderBy: { updatedAt: "desc" } });
    return { items: await this.attachApplications(items) };
  }

  async updateRecruiterApplicationStatus(user: AuthLikeUser, id: string, body: Record<string, unknown>) {
    const application = await this.prisma.recruiterApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException("Application not found");
    await this.assertRecruiterJobAccess(user, application.recruiterJobId);
    return this.prisma.recruiterApplication.update({ where: { id }, data: { status: String(body.status ?? application.status).toLowerCase() } });
  }

  async publicRecruiterJobs(user: AuthLikeUser, query: Query = {}) {
    const page = this.page(query);
    const limit = this.limit(query, 20, 100);
    const where: Prisma.RecruiterJobWhereInput = { status: "open", visibility: { in: ["public", "specific_colleges"] } };
    if (query.search) where.title = { contains: query.search, mode: "insensitive" };
    const [jobs, total] = await Promise.all([
      this.prisma.recruiterJob.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { deadline: "asc" } }),
      this.prisma.recruiterJob.count({ where })
    ]);
    return { items: await this.attachOrganizationsToJobs(jobs), total, page, limit };
  }

  async publicRecruiterJob(user: AuthLikeUser, id: string) {
    const job = await this.prisma.recruiterJob.findFirst({ where: { id, status: "open" } });
    if (!job) throw new NotFoundException("Recruiter job not found");
    const [organization, applied] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: job.organizationId } }),
      this.studentProfileForUser(user.id).then((profile) => this.prisma.recruiterApplication.findFirst({ where: { recruiterJobId: id, studentProfileId: profile.id } }))
    ]);
    return { ...job, organization, applied: Boolean(applied) };
  }

  async applyRecruiterJob(user: AuthLikeUser, id: string) {
    const profile = await this.studentProfileForUser(user.id);
    const job = await this.prisma.recruiterJob.findFirst({ where: { id, status: "open" } });
    if (!job) throw new NotFoundException("Recruiter job not found");
    const matchScore = await this.recruiterMatchScore(profile.id, job);
    return this.prisma.recruiterApplication.upsert({
      where: { recruiterJobId_studentProfileId: { recruiterJobId: id, studentProfileId: profile.id } },
      create: { recruiterJobId: id, studentProfileId: profile.id, status: "applied", matchScore, source: "student" },
      update: { status: "applied", matchScore, source: "student" }
    });
  }

  async studentInvites(user: AuthLikeUser) {
    const profile = await this.studentProfileForUser(user.id);
    const invites = await this.prisma.contactRequest.findMany({
      where: { studentProfileId: profile.id, status: "pending" },
      orderBy: { createdAt: "desc" }
    });
    return { items: await this.attachOrganizationsToContactRequests(invites) };
  }

  async studentContactRequests(user: AuthLikeUser) {
    const profile = await this.studentProfileForUser(user.id);
    const requests = await this.prisma.contactRequest.findMany({
      where: { studentProfileId: profile.id },
      orderBy: { createdAt: "desc" }
    });
    return { items: await this.attachOrganizationsToContactRequests(requests) };
  }

  async respondContactRequest(user: AuthLikeUser, id: string, body: Record<string, unknown>) {
    const profile = await this.studentProfileForUser(user.id);
    const request = await this.prisma.contactRequest.findFirst({ where: { id, studentProfileId: profile.id } });
    if (!request) throw new NotFoundException("Contact request not found");
    const status = String(body.status ?? "rejected").toLowerCase();
    if (!["accepted", "rejected"].includes(status)) throw new BadRequestException("Invalid response");
    return this.prisma.contactRequest.update({ where: { id }, data: { status } });
  }

  async studentVisibility(user: AuthLikeUser) {
    const profile = await this.studentProfileForUser(user.id);
    return this.prisma.studentVisibilitySetting.upsert({
      where: { studentProfileId: profile.id },
      create: { studentProfileId: profile.id },
      update: {}
    });
  }

  async updateStudentVisibility(user: AuthLikeUser, body: Record<string, unknown>) {
    const profile = await this.studentProfileForUser(user.id);
    const visibility = String(body.visibility ?? "private").toLowerCase();
    if (!["private", "college_only", "verified_recruiters", "public"].includes(visibility)) throw new BadRequestException("Invalid visibility setting");
    return this.prisma.studentVisibilitySetting.upsert({
      where: { studentProfileId: profile.id },
      create: {
        studentProfileId: profile.id,
        visibility,
        allowRecruiterContact: Boolean(body.allowRecruiterContact),
        showEmail: Boolean(body.showEmail),
        showPhone: Boolean(body.showPhone),
        showResume: Boolean(body.showResume),
        availabilityStatus: String(body.availabilityStatus ?? "available")
      },
      update: {
        visibility,
        allowRecruiterContact: Boolean(body.allowRecruiterContact),
        showEmail: Boolean(body.showEmail),
        showPhone: Boolean(body.showPhone),
        showResume: Boolean(body.showResume),
        availabilityStatus: String(body.availabilityStatus ?? "available")
      }
    });
  }

  async collegeOnboarding(user: AuthLikeUser, body: Record<string, unknown>) {
    if (!COLLEGE_ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException("Only college admins can onboard a college");
    }
    const organization = await this.prisma.organization.create({
      data: {
        name: String(body.collegeName ?? body.name ?? "New College"),
        type: "COLLEGE",
        website: this.optionalString(body.website),
        location: [body.city, body.state].filter(Boolean).join(", ") || this.optionalString(body.location),
        status: "trialing",
        metadataJson: json({
          officialEmail: body.officialEmail,
          collegeType: body.collegeType,
          departments: body.departments,
          approxStudentCount: body.approxStudentCount,
          tpoContactName: body.tpoContactName,
          tpoContactEmail: body.tpoContactEmail,
          phone: body.phone,
          planSelected: body.planSelected
        })
      }
    });
    await this.prisma.organizationMember.create({ data: { organizationId: organization.id, userId: user.id, role: Role.COLLEGE_ADMIN } });
    const plan = body.planSelected ? await this.prisma.plan.findUnique({ where: { code: String(body.planSelected) } }) : null;
    if (plan) {
      await this.createTrialSubscription({ organizationId: organization.id, planId: plan.id });
    }
    return organization;
  }

  async collegeSettings(user: AuthLikeUser) {
    return this.ensureOrganization(user, "COLLEGE");
  }

  async updateCollegeSettings(user: AuthLikeUser, body: Record<string, unknown>) {
    const organization = await this.ensureOrganization(user, "COLLEGE");
    if (!COLLEGE_ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException("Only college admins can update college settings");
    }
    return this.prisma.organization.update({
      where: { id: organization.id },
      data: {
        name: this.optionalString(body.name) ?? organization.name,
        website: this.optionalString(body.website),
        location: this.optionalString(body.location),
        metadataJson: json(body.metadataJson ?? {})
      }
    });
  }

  async collegeTeam(user: AuthLikeUser) {
    const organization = await this.ensureOrganization(user, "COLLEGE");
    const members = await this.prisma.organizationMember.findMany({ where: { organizationId: organization.id, status: { not: "disabled" } } });
    const users = await this.prisma.user.findMany({
      where: { id: { in: members.map((member) => member.userId) } },
      select: { id: true, name: true, email: true, role: true }
    });
    const byId = new Map(users.map((item) => [item.id, item]));
    return { organization, members: members.map((member) => ({ ...member, user: byId.get(member.userId) })) };
  }

  async inviteCollegeMember(user: AuthLikeUser, body: Record<string, unknown>) {
    const organization = await this.ensureOrganization(user, "COLLEGE");
    if (!COLLEGE_ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException("Only college admins can invite TPO admins");
    }
    return this.createInvitation(organization.id, user.id, String(body.email ?? ""), Role.TPO_ADMIN);
  }

  async billing(user: AuthLikeUser) {
    const context = await this.billingContext(user);
    const [subscription, payments, invoices, usage] = await Promise.all([
      this.currentSubscription(context),
      this.prisma.payment.findMany({ where: context, orderBy: { createdAt: "desc" }, take: 20 }),
      this.prisma.invoice.findMany({ where: context, orderBy: { issuedAt: "desc" }, take: 20 }),
      this.usageSummary(user)
    ]);
    return { subscription, payments, invoices, usage, paymentsConfigured: this.paymentsConfigured() };
  }

  async createCheckout(user: AuthLikeUser, body: Record<string, unknown>) {
    const plan = await this.plan(String(body.planCode ?? body.plan));
    const cycle = String(body.billingCycle ?? "monthly").toLowerCase();
    const amount = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
    const context = await this.billingContext(user, plan.audience);
    const subscription = await this.ensureSubscription(context, plan.id, cycle);
    if (!this.paymentsConfigured()) {
      return {
        configured: false,
        message: "Payments are not configured in this environment.",
        subscription,
        checkout: null
      };
    }

    const order = await this.createRazorpayOrder(amount, plan.currency, { subscriptionId: subscription.id, planCode: plan.code });
    await this.prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        organizationId: context.organizationId,
        userId: context.userId,
        providerOrderId: order.id,
        amount,
        currency: plan.currency,
        status: "created",
        rawPayloadJson: json(order)
      }
    });
    return {
      configured: true,
      subscription,
      checkout: {
        key: this.config.get<string>("RAZORPAY_KEY_ID"),
        amount,
        currency: plan.currency,
        name: "PlaceMate AI",
        description: plan.name,
        orderId: order.id,
        prefill: { name: user.name, email: user.email }
      }
    };
  }

  async verifyRazorpayPayment(user: AuthLikeUser, body: Record<string, unknown>) {
    const orderId = String(body.razorpay_order_id ?? "");
    const paymentId = String(body.razorpay_payment_id ?? "");
    const signature = String(body.razorpay_signature ?? "");
    if (!orderId || !paymentId || !signature) throw new BadRequestException("Missing Razorpay verification data");
    const payment = await this.prisma.payment.findFirst({ where: { providerOrderId: orderId } });
    if (!payment) throw new NotFoundException("Payment record not found");
    const context: BillingContext = await this.billingContext(user).catch(() => ({ userId: user.id }));
    if ((payment.organizationId && payment.organizationId !== context.organizationId) || (payment.userId && payment.userId !== context.userId && payment.userId !== user.id)) {
      throw new ForbiddenException("Payment does not belong to this account");
    }
    this.verifySignature(`${payment.providerOrderId}|${paymentId}`, signature, this.config.get<string>("RAZORPAY_KEY_SECRET") ?? "");
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: paymentId,
        status: "paid",
        paidAt: new Date(),
        rawPayloadJson: json(body)
      }
    });
    if (payment.subscriptionId) {
      await this.prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: "active", startDate: new Date(), currentPeriodStart: new Date(), currentPeriodEnd: this.addMonths(new Date(), 1) }
      });
      await this.createInvoiceForPayment(updated);
    }
    return { ok: true, payment: updated };
  }

  async razorpayWebhook(rawBody: Buffer | undefined, signature: string | undefined, payload: Record<string, unknown>) {
    const secret = this.config.get<string>("RAZORPAY_WEBHOOK_SECRET");
    if (!secret) return { ok: true, ignored: true, message: "Webhook secret is not configured" };
    if (!rawBody || !signature) throw new BadRequestException("Missing webhook signature");
    this.verifySignature(rawBody, signature, secret);
    const event = String(payload.event ?? "");
    const paymentEntity = this.nested(payload, ["payload", "payment", "entity"]);
    if (paymentEntity && typeof paymentEntity === "object") {
      const payment = paymentEntity as Record<string, unknown>;
      const providerOrderId = this.optionalString(payment.order_id);
      const providerPaymentId = this.optionalString(payment.id);
      const existing = providerOrderId ? await this.prisma.payment.findFirst({ where: { providerOrderId } }) : null;
      if (existing) {
        const status = event.includes("failed") ? "failed" : event.includes("captured") || event.includes("authorized") ? "paid" : String(payment.status ?? existing.status);
        const updated = await this.prisma.payment.update({
          where: { id: existing.id },
          data: {
            providerPaymentId,
            status,
            method: this.optionalString(payment.method),
            paidAt: status === "paid" ? new Date() : existing.paidAt,
            rawPayloadJson: json(payload)
          }
        });
        if (status === "paid" && existing.subscriptionId) {
          await this.prisma.subscription.update({ where: { id: existing.subscriptionId }, data: { status: "active" } });
          await this.createInvoiceForPayment(updated);
        }
      }
    }
    return { ok: true };
  }

  async cancelBilling(user: AuthLikeUser) {
    const context = await this.billingContext(user);
    const subscription = await this.currentSubscription(context);
    if (!subscription) throw new NotFoundException("Subscription not found");
    return this.prisma.subscription.update({ where: { id: subscription.id }, data: { cancelAtPeriodEnd: true, status: "cancelled" } });
  }

  async changePlan(user: AuthLikeUser, body: Record<string, unknown>) {
    const plan = await this.plan(String(body.planCode ?? body.plan));
    const context = await this.billingContext(user, plan.audience);
    return this.ensureSubscription(context, plan.id, String(body.billingCycle ?? "monthly"));
  }

  async usageSummary(user: AuthLikeUser) {
    const context: BillingContext = await this.billingContext(user).catch(() => ({ userId: user.id }));
    const subscription = await this.currentSubscription(context);
    const limits = this.limitsFromPlan(subscription?.plan?.limitsJson);
    const featureKeys = Object.keys(Object.keys(limits).length ? limits : this.defaultLimitsForRole(user.role));
    const keys = featureKeys.length ? featureKeys : ["job_posts", "candidate_views", "student_profiles", "drives", "resume_analyses", "skillproof_refreshes", "roadmaps", "exports"];
    const items = await Promise.all(keys.map(async (featureKey) => {
      const used = await this.usageForFeature(context.organizationId, featureKey, context.userId);
      const limit = this.limitFromRecord(limits[featureKey]);
      return {
        featureKey,
        used,
        limit: limit === CONTACT_SALES_LIMIT ? null : limit,
        remaining: limit === null || limit === CONTACT_SALES_LIMIT ? null : Math.max(0, limit - used)
      };
    }));
    return { context, subscription, items };
  }

  async usageCheck(user: AuthLikeUser, body: Record<string, unknown>): Promise<UsageCheck> {
    const context: BillingContext = await this.billingContext(user).catch(() => ({ userId: user.id }));
    const featureKey = String(body.featureKey ?? "");
    return this.checkUsage(context.organizationId, context.userId ?? user.id, featureKey, Number(body.count ?? 1));
  }

  async usageIncrement(user: AuthLikeUser, body: Record<string, unknown>) {
    const context: BillingContext = await this.billingContext(user).catch(() => ({ userId: user.id }));
    const featureKey = String(body.featureKey ?? "");
    const check = await this.checkUsage(context.organizationId, context.userId ?? user.id, featureKey, Number(body.count ?? 1));
    if (!check.allowed) throw new ForbiddenException(check.message);
    await this.incrementUsage({ organizationId: context.organizationId, userId: context.userId ?? user.id, featureKey, count: Number(body.count ?? 1), metadata: body.metadata });
    return this.checkUsage(context.organizationId, context.userId ?? user.id, featureKey, 0);
  }

  async adminSaasDashboard() {
    const [revenue, activeSubscriptions, trialUsers, cancelledSubscriptions, failedPayments, colleges, companies, recruiters, students, planDistribution, recentPayments, recentColleges, recentCompanies] =
      await Promise.all([
        this.prisma.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
        this.prisma.subscription.count({ where: { status: "active" } }),
        this.prisma.subscription.count({ where: { status: "trialing" } }),
        this.prisma.subscription.count({ where: { status: "cancelled" } }),
        this.prisma.payment.count({ where: { status: { in: ["failed", "past_due"] } } }),
        this.prisma.organization.count({ where: { type: "COLLEGE" } }),
        this.prisma.organization.count({ where: { type: "COMPANY" } }),
        this.prisma.user.count({ where: { role: { in: [Role.RECRUITER, Role.COMPANY_ADMIN] } } }),
        this.prisma.user.count({ where: { role: Role.STUDENT } }),
        this.prisma.subscription.groupBy({ by: ["planId"], _count: { planId: true } }),
        this.prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
        this.prisma.organization.findMany({ where: { type: "COLLEGE" }, orderBy: { createdAt: "desc" }, take: 5 }),
        this.prisma.organization.findMany({ where: { type: "COMPANY" }, orderBy: { createdAt: "desc" }, take: 5 })
      ]);
    const plans = await this.prisma.plan.findMany({ where: { id: { in: planDistribution.map((item) => item.planId) } } });
    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    return {
      cards: {
        totalRevenue: revenue._sum.amount ?? 0,
        monthlyRecurringRevenue: revenue._sum.amount ?? 0,
        activeSubscriptions,
        trialUsers,
        cancelledSubscriptions,
        failedPayments,
        totalColleges: colleges,
        totalCompanies: companies,
        totalRecruiters: recruiters,
        totalStudents: students
      },
      planDistribution: planDistribution.map((item) => ({ plan: planById.get(item.planId)?.name ?? item.planId, subscriptions: item._count.planId })),
      recentPayments,
      recentlyOnboardedColleges: recentColleges,
      recentlyOnboardedCompanies: recentCompanies
    };
  }

  async adminOrganizations(query: Query = {}) {
    const where: Prisma.OrganizationWhereInput = {};
    if (query.type) where.type = query.type.toUpperCase();
    if (query.status) where.status = query.status;
    const items = await this.prisma.organization.findMany({ where, orderBy: { createdAt: "desc" }, take: this.limit(query, 50, 100) });
    return { items };
  }

  async adminOrganization(id: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (!organization) throw new NotFoundException("Organization not found");
    const [members, subscription, payments, logs] = await Promise.all([
      this.prisma.organizationMember.findMany({ where: { organizationId: id } }),
      this.currentSubscription({ organizationId: id }),
      this.prisma.payment.findMany({ where: { organizationId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
      this.prisma.accountStatusLog.findMany({ where: { organizationId: id }, orderBy: { createdAt: "desc" }, take: 10 })
    ]);
    return { organization, members, subscription, payments, logs };
  }

  async setOrganizationStatus(id: string, body: Record<string, unknown>, performedById: string) {
    const status = String(body.status ?? "active").toLowerCase();
    const organization = await this.prisma.organization.update({ where: { id }, data: { status } });
    await this.prisma.accountStatusLog.create({
      data: {
        organizationId: id,
        action: status === "suspended" ? "suspended" : "activated",
        reason: this.optionalString(body.reason),
        performedById
      }
    });
    return organization;
  }

  async adminSubscriptions() {
    const items = await this.prisma.subscription.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return { items: await this.attachPlansAndOrganizations(items) };
  }

  async overrideSubscription(id: string, body: Record<string, unknown>, performedById: string) {
    const plan = body.planCode ? await this.prisma.plan.findUnique({ where: { code: String(body.planCode) } }) : null;
    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: this.optionalString(body.status),
        planId: plan?.id,
        currentPeriodEnd: body.currentPeriodEnd ? new Date(String(body.currentPeriodEnd)) : undefined
      }
    });
    await this.prisma.accountStatusLog.create({
      data: {
        organizationId: subscription.organizationId,
        userId: subscription.userId,
        action: "subscription_override",
        reason: this.optionalString(body.reason),
        performedById
      }
    });
    return subscription;
  }

  async adminPayments() {
    return { items: await this.prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 100 }) };
  }

  async adminRevenue() {
    const payments = await this.prisma.payment.findMany({ where: { status: "paid" }, orderBy: { paidAt: "desc" }, take: 500 });
    const byMonth = payments.reduce<Record<string, number>>((acc, payment) => {
      const key = (payment.paidAt ?? payment.createdAt).toISOString().slice(0, 7);
      acc[key] = (acc[key] ?? 0) + payment.amount;
      return acc;
    }, {});
    return {
      totalRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
      revenueByMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })),
      recentPayments: payments.slice(0, 12)
    };
  }

  async adminAccountLogs() {
    return { items: await this.prisma.accountStatusLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }) };
  }

  private async createInvitation(organizationId: string, invitedById: string, email: string, role: Role) {
    if (!email) throw new BadRequestException("Email is required");
    return this.prisma.teamInvitation.create({
      data: {
        organizationId,
        email: email.toLowerCase(),
        role,
        token: randomBytes(24).toString("hex"),
        invitedById,
        expiresAt: this.addDays(new Date(), 7)
      }
    });
  }

  private jobData(organizationId: string, createdById: string, body: Record<string, unknown>): Prisma.RecruiterJobUncheckedCreateInput {
    return {
      organizationId,
      createdById,
      title: String(body.title ?? "Untitled job"),
      roleCategory: this.optionalString(body.roleCategory),
      jobType: String(body.jobType ?? "FULL_TIME"),
      workMode: String(body.workMode ?? "Hybrid"),
      location: String(body.location ?? "Remote"),
      ctc: body.ctc === undefined || body.ctc === null || body.ctc === "" ? undefined : Number(body.ctc),
      stipend: body.stipend === undefined || body.stipend === null || body.stipend === "" ? undefined : Number(body.stipend),
      experienceLevel: this.optionalString(body.experienceLevel),
      description: String(body.description ?? "Job description pending."),
      requiredSkillsJson: json(this.arrayFrom(body.requiredSkills ?? body.requiredSkillsJson)),
      preferredSkillsJson: json(this.arrayFrom(body.preferredSkills ?? body.preferredSkillsJson)),
      eligibilityJson: json(body.eligibilityJson ?? body.eligibility ?? {}),
      minimumCgpa: Number(body.minimumCgpa ?? 0),
      allowedBranchesJson: json(this.arrayFrom(body.allowedBranches ?? body.allowedBranchesJson)),
      maxBacklogs: Number(body.maxBacklogs ?? 0),
      hiringRoundsJson: json(this.arrayFrom(body.hiringRounds ?? body.hiringRoundsJson)),
      openings: Number(body.openings ?? 1),
      deadline: body.deadline ? new Date(String(body.deadline)) : this.addDays(new Date(), 30),
      visibility: String(body.visibility ?? "public").toLowerCase(),
      status: String(body.status ?? "draft").toLowerCase()
    };
  }

  private candidateInclude(includeDetails = false): Prisma.StudentProfileInclude {
    return {
      user: { select: { id: true, name: true, email: true } },
      skills: true,
      projects: includeDetails ? true : { take: 2, orderBy: { title: "asc" } },
      education: includeDetails,
      githubProfile: { select: { githubScore: true, username: true, lastSyncedAt: true } },
      leetcodeProfile: { select: { leetcodeScore: true, totalSolved: true, username: true } },
      hackerRankProfile: { select: { hackerRankScore: true, username: true } },
      resumeAnalyses: { orderBy: { analyzedAt: "desc" as const }, take: 1 },
      skillProofScores: { orderBy: { calculatedAt: "desc" as const }, take: 1 },
      skillVerifications: includeDetails ? { orderBy: { confidenceScore: "desc" as const }, take: 20 } : false
    };
  }

  private candidateSummary(student: any, visibility?: { showEmail?: boolean; showPhone?: boolean; showResume?: boolean; allowRecruiterContact?: boolean } | null, jobId?: string) {
    const skillProofScore = student.skillProofScores?.[0]?.overallScore ?? 0;
    const resume = student.resumeAnalyses?.[0];
    const skills = student.skills?.map((skill: { name: string }) => skill.name) ?? [];
    return {
      id: student.id,
      name: student.user?.name,
      collegeName: student.collegeName,
      branch: student.branch,
      graduationYear: student.graduationYear,
      cgpa: student.cgpa,
      location: student.location,
      targetRole: student.targetRole,
      placementStatus: student.placementStatus,
      skills: skills.slice(0, 8),
      topProjects: student.projects ?? [],
      skillProofScore,
      resumeScore: resume?.resumeScore ?? 0,
      githubScore: student.githubProfile?.githubScore ?? 0,
      leetcodeScore: student.leetcodeProfile?.leetcodeScore ?? 0,
      hackerRankScore: student.hackerRankProfile?.hackerRankScore ?? 0,
      matchScore: jobId ? Math.min(100, skillProofScore + 4) : skillProofScore,
      canContact: Boolean(visibility?.allowRecruiterContact),
      resumeVisible: Boolean(visibility?.showResume)
    };
  }

  private async requireRecruiterVisibility(studentProfileId: string) {
    const setting = await this.prisma.studentVisibilitySetting.findUnique({ where: { studentProfileId } });
    if (!setting || !["verified_recruiters", "public"].includes(setting.visibility)) {
      throw new ForbiddenException("This student has not opted into recruiter visibility");
    }
    return setting;
  }

  private async studentProfileForUser(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Student profile not found");
    return profile;
  }

  private async recruiterMatchScore(studentProfileId: string, job: { requiredSkillsJson: Prisma.JsonValue; minimumCgpa: number; maxBacklogs: number }) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: { skills: true, skillProofScores: { orderBy: { calculatedAt: "desc" }, take: 1 } }
    });
    if (!student) return 0;
    const required = this.arrayFrom(job.requiredSkillsJson);
    const skillSet = new Set(student.skills.map((skill) => skill.name.toLowerCase()));
    const skillScore = required.length ? (required.filter((skill) => skillSet.has(skill.toLowerCase())).length / required.length) * 60 : 35;
    const academic = (student.cgpa ?? 0) >= job.minimumCgpa && student.activeBacklogs <= job.maxBacklogs ? 20 : 8;
    return Math.round(Math.min(100, skillScore + academic + (student.skillProofScores[0]?.overallScore ?? 0) * 0.2));
  }

  private async attachStudentsToShortlists(items: Array<{ studentProfileId: string } & Record<string, unknown>>) {
    const students = await this.prisma.studentProfile.findMany({
      where: { id: { in: items.map((item) => item.studentProfileId) } },
      include: { user: { select: { name: true, email: true } }, skills: true, skillProofScores: { orderBy: { calculatedAt: "desc" }, take: 1 } }
    });
    const byId = new Map(students.map((student) => [student.id, student]));
    return items.map((item) => ({ ...item, student: byId.get(item.studentProfileId) }));
  }

  private async attachApplications(items: Array<{ recruiterJobId: string; studentProfileId: string } & Record<string, unknown>>) {
    const [jobs, students] = await Promise.all([
      this.prisma.recruiterJob.findMany({ where: { id: { in: items.map((item) => item.recruiterJobId) } } }),
      this.prisma.studentProfile.findMany({ where: { id: { in: items.map((item) => item.studentProfileId) } }, include: { user: { select: { name: true, email: true } } } })
    ]);
    const jobById = new Map(jobs.map((job) => [job.id, job]));
    const studentById = new Map(students.map((student) => [student.id, student]));
    return items.map((item) => ({ ...item, job: jobById.get(item.recruiterJobId), student: studentById.get(item.studentProfileId) }));
  }

  private async attachOrganizationsToJobs(jobs: Array<{ organizationId: string } & Record<string, unknown>>) {
    const organizations = await this.prisma.organization.findMany({ where: { id: { in: jobs.map((job) => job.organizationId) } } });
    const byId = new Map(organizations.map((organization) => [organization.id, organization]));
    return jobs.map((job) => ({ ...job, organization: byId.get(job.organizationId) }));
  }

  private async attachOrganizationsToContactRequests(requests: Array<{ organizationId: string; recruiterJobId: string | null } & Record<string, unknown>>) {
    const [organizations, jobs] = await Promise.all([
      this.prisma.organization.findMany({ where: { id: { in: requests.map((request) => request.organizationId) } } }),
      this.prisma.recruiterJob.findMany({ where: { id: { in: requests.map((request) => request.recruiterJobId).filter((id): id is string => Boolean(id)) } } })
    ]);
    const orgById = new Map(organizations.map((organization) => [organization.id, organization]));
    const jobById = new Map(jobs.map((job) => [job.id, job]));
    return requests.map((request) => ({ ...request, organization: orgById.get(request.organizationId), job: request.recruiterJobId ? jobById.get(request.recruiterJobId) : null }));
  }

  private async attachPlansAndOrganizations(items: Array<{ planId: string; organizationId: string | null } & Record<string, unknown>>) {
    const [plans, organizations] = await Promise.all([
      this.prisma.plan.findMany({ where: { id: { in: items.map((item) => item.planId) } } }),
      this.prisma.organization.findMany({ where: { id: { in: items.map((item) => item.organizationId).filter((id): id is string => Boolean(id)) } } })
    ]);
    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    const orgById = new Map(organizations.map((organization) => [organization.id, organization]));
    return items.map((item) => ({ ...item, plan: planById.get(item.planId), organization: item.organizationId ? orgById.get(item.organizationId) : null }));
  }

  private async ensureOrganization(user: AuthLikeUser, type: "COMPANY" | "COLLEGE") {
    if (user.role === Role.SUPER_ADMIN) {
      const organization = await this.prisma.organization.findFirst({ where: { type }, orderBy: { createdAt: "asc" } });
      if (!organization) throw new NotFoundException(`${type.toLowerCase()} organization not found`);
      return organization;
    }
    const memberships = await this.prisma.organizationMember.findMany({ where: { userId: user.id, status: "active" } });
    const organizations = await this.prisma.organization.findMany({
      where: { id: { in: memberships.map((member) => member.organizationId) }, type }
    });
    const organization = organizations[0];
    if (!organization) throw new ForbiddenException(`No active ${type.toLowerCase()} organization access`);
    return organization;
  }

  private async assertOrganizationActive(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization || organization.status === "suspended") throw new ForbiddenException("Organization is suspended");
  }

  private async assertRecruiterJobAccess(user: AuthLikeUser, id: string) {
    const organization = await this.ensureOrganization(user, "COMPANY");
    const job = await this.prisma.recruiterJob.findFirst({ where: { id, organizationId: organization.id } });
    if (!job) throw new NotFoundException("Recruiter job not found");
    return job;
  }

  private async jobIdsForOrganization(organizationId: string) {
    const jobs = await this.prisma.recruiterJob.findMany({ where: { organizationId }, select: { id: true } });
    return jobs.map((job) => job.id);
  }

  private async activityForOrganization(organizationId: string) {
    const [views, shortlists, contacts] = await Promise.all([
      this.prisma.candidateView.findMany({ where: { organizationId }, orderBy: { viewedAt: "desc" }, take: 4 }),
      this.prisma.candidateShortlist.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 4 }),
      this.prisma.contactRequest.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 4 })
    ]);
    return [
      ...views.map((item) => ({ type: "candidate_view", label: "Candidate profile viewed", createdAt: item.viewedAt })),
      ...shortlists.map((item) => ({ type: "shortlist", label: `Candidate moved to ${item.status}`, createdAt: item.updatedAt })),
      ...contacts.map((item) => ({ type: "contact_request", label: `Contact request ${item.status}`, createdAt: item.createdAt }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8);
  }

  private async billingContext(user: AuthLikeUser, audience?: string): Promise<BillingContext> {
    const normalizedAudience = audience?.toUpperCase();
    if (normalizedAudience === "STUDENT" || user.role === Role.STUDENT) return { userId: user.id };
    if (normalizedAudience === "COLLEGE" || COLLEGE_ROLES.includes(user.role)) {
      const organization = await this.ensureOrganization(user, "COLLEGE");
      return { organizationId: organization.id };
    }
    if (normalizedAudience === "RECRUITER" || COMPANY_ROLES.includes(user.role)) {
      const organization = await this.ensureOrganization(user, "COMPANY");
      return { organizationId: organization.id };
    }
    return { userId: user.id };
  }

  private async currentSubscription(context: { organizationId?: string | null; userId?: string | null }) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        organizationId: context.organizationId ?? undefined,
        userId: context.userId ?? undefined
      },
      orderBy: { createdAt: "desc" }
    });
    if (!subscription) return null;
    const plan = await this.prisma.plan.findUnique({ where: { id: subscription.planId } });
    return { ...subscription, plan };
  }

  private async ensureSubscription(context: { organizationId?: string | null; userId?: string | null }, planId: string, billingCycle = "monthly") {
    const existing = await this.prisma.subscription.findFirst({
      where: { organizationId: context.organizationId ?? undefined, userId: context.userId ?? undefined },
      orderBy: { createdAt: "desc" }
    });
    const periodEnd = billingCycle === "yearly" ? this.addMonths(new Date(), 12) : this.addMonths(new Date(), 1);
    if (existing) {
      return this.prisma.subscription.update({
        where: { id: existing.id },
        data: { planId, billingCycle, currentPeriodStart: new Date(), currentPeriodEnd: periodEnd, status: existing.status === "active" ? "active" : "trialing" }
      });
    }
    return this.createTrialSubscription({ ...context, planId, billingCycle });
  }

  private async createTrialSubscription(input: { organizationId?: string | null; userId?: string | null; planId: string; billingCycle?: string }) {
    const trialDays = Number(this.config.get<string>("BILLING_TRIAL_DAYS") ?? 14);
    return this.prisma.subscription.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        planId: input.planId,
        billingCycle: input.billingCycle ?? "monthly",
        status: "trialing",
        trialEndsAt: this.addDays(new Date(), trialDays),
        currentPeriodEnd: this.addDays(new Date(), trialDays)
      }
    });
  }

  private limitsFromPlan(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  }

  private defaultLimitsForRole(role: string): Record<string, number> {
    if (COMPANY_ROLES.includes(role)) return { job_posts: 5, candidate_views: 100 };
    if (COLLEGE_ROLES.includes(role)) return { student_profiles: 500, drives: 20, exports: 0 };
    return { resume_analyses: 1, skillproof_refreshes: 3, company_fit_checks: 5, roadmaps: 1 };
  }

  private limitFromRecord(value: unknown): number | null {
    if (value === undefined || value === null) return null;
    if (String(value).toLowerCase() === "unlimited") return CONTACT_SALES_LIMIT;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  }

  private async checkUsage(organizationId: string | undefined | null, userId: string | undefined | null, featureKey: string, count: number): Promise<UsageCheck> {
    const subscription = await this.currentSubscription({ organizationId, userId });
    const limits = this.limitsFromPlan(subscription?.plan?.limitsJson);
    const fallback = userId ? await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } }) : null;
    const limit = this.limitFromRecord(limits[featureKey] ?? this.defaultLimitsForRole(fallback?.role ?? "")[featureKey]);
    const used = await this.usageForFeature(organizationId, featureKey, userId ?? undefined);
    if (limit === null || limit === CONTACT_SALES_LIMIT) return { allowed: true, featureKey, limit, used, remaining: null };
    const allowed = used + count <= limit;
    return {
      allowed,
      featureKey,
      limit,
      used,
      remaining: Math.max(0, limit - used),
      message: allowed ? undefined : `You have reached your ${featureKey.replace(/_/g, " ")} limit for this period.`
    };
  }

  private async assertUsageAvailable(organizationId: string | undefined | null, userId: string, featureKey: string, count: number, message: string) {
    const check = await this.checkUsage(organizationId, userId, featureKey, count);
    if (!check.allowed) throw new ForbiddenException(message);
  }

  private async usageForFeature(organizationId: string | undefined | null, featureKey: string, userId?: string | null) {
    const { periodStart, periodEnd } = this.currentMonth();
    const aggregate = await this.prisma.usageRecord.aggregate({
      where: {
        organizationId: organizationId ?? undefined,
        userId: organizationId ? undefined : userId ?? undefined,
        featureKey,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd }
      },
      _sum: { count: true }
    });
    return aggregate._sum.count ?? 0;
  }

  private async incrementUsage(input: { organizationId?: string | null; userId?: string | null; featureKey: string; count: number; metadata?: unknown }) {
    const { periodStart, periodEnd } = this.currentMonth();
    return this.prisma.usageRecord.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        featureKey: input.featureKey,
        count: input.count,
        periodStart,
        periodEnd,
        metadataJson: input.metadata === undefined ? undefined : json(input.metadata)
      }
    });
  }

  private paymentsConfigured() {
    return Boolean(this.config.get<string>("ENABLE_PAYMENTS") !== "false" && this.config.get<string>("RAZORPAY_KEY_ID") && this.config.get<string>("RAZORPAY_KEY_SECRET"));
  }

  private async createRazorpayOrder(amount: number, currency: string, notes: Record<string, string>) {
    const keyId = this.config.get<string>("RAZORPAY_KEY_ID");
    const keySecret = this.config.get<string>("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) throw new BadRequestException("Payments are not configured");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: `pm_${Date.now()}`,
        notes
      })
    });
    if (!response.ok) throw new BadRequestException("Could not create Razorpay order");
    return await response.json() as { id: string; amount: number; currency: string; status: string };
  }

  private verifySignature(payload: string | Buffer, signature: string, secret: string) {
    if (!secret) throw new BadRequestException("Payment secret is not configured");
    const digest = createHmac("sha256", secret).update(payload).digest("hex");
    const left = Buffer.from(digest);
    const right = Buffer.from(signature);
    if (left.length !== right.length || !timingSafeEqual(left, right)) throw new BadRequestException("Invalid Razorpay signature");
  }

  private async createInvoiceForPayment(payment: { id: string; subscriptionId: string | null; organizationId: string | null; amount: number; currency: string; paidAt: Date | null }) {
    const existing = await this.prisma.invoice.findFirst({ where: { paymentId: payment.id } });
    if (existing) return existing;
    return this.prisma.invoice.create({
      data: {
        subscriptionId: payment.subscriptionId,
        organizationId: payment.organizationId,
        paymentId: payment.id,
        invoiceNumber: `PM-${Date.now()}-${payment.id.slice(-5).toUpperCase()}`,
        amount: payment.amount,
        currency: payment.currency,
        status: "paid",
        paidAt: payment.paidAt ?? new Date()
      }
    });
  }

  private nested(payload: Record<string, unknown>, keys: string[]) {
    return keys.reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== "object") return undefined;
      return (acc as Record<string, unknown>)[key];
    }, payload);
  }

  private currentMonth() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { periodStart, periodEnd };
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  }

  private page(query: Query) {
    return Math.max(Number(query.page ?? 1), 1);
  }

  private limit(query: Query, fallback: number, max: number) {
    return Math.min(Math.max(Number(query.limit ?? fallback), 1), max);
  }

  private optionalString(value: unknown) {
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim();
    return text ? text : undefined;
  }

  private arrayFrom(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
    if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
    return [];
  }
}
