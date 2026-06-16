ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'COMPANY_ADMIN';

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "description" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "departmentsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecruiterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "designation" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecruiterProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecruiterJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roleCategory" TEXT,
    "jobType" TEXT NOT NULL,
    "workMode" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "ctc" DOUBLE PRECISION,
    "stipend" DOUBLE PRECISION,
    "experienceLevel" TEXT,
    "description" TEXT NOT NULL,
    "requiredSkillsJson" JSONB NOT NULL,
    "preferredSkillsJson" JSONB,
    "eligibilityJson" JSONB,
    "minimumCgpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowedBranchesJson" JSONB,
    "maxBacklogs" INTEGER NOT NULL DEFAULT 0,
    "hiringRoundsJson" JSONB,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "deadline" TIMESTAMP(3) NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecruiterJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecruiterApplication" (
    "id" TEXT NOT NULL,
    "recruiterJobId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'student',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecruiterApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateView" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "recruiterJobId" TEXT,
    "organizationId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CandidateView_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateShortlist" (
    "id" TEXT NOT NULL,
    "recruiterJobId" TEXT,
    "studentProfileId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'saved',
    "rating" INTEGER,
    "notes" TEXT,
    "interviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CandidateShortlist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recruiterJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" INTEGER NOT NULL DEFAULT 0,
    "priceYearly" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "featuresJson" JSONB NOT NULL,
    "limitsJson" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "razorpayCustomerId" TEXT,
    "razorpaySubscriptionId" TEXT,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "organizationId" TEXT,
    "userId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "providerPaymentId" TEXT,
    "providerOrderId" TEXT,
    "providerSubscriptionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "method" TEXT,
    "paidAt" TIMESTAMP(3),
    "rawPayloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "organizationId" TEXT,
    "paymentId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'issued',
    "invoiceUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "featureKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeatureLimit" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "limitValue" INTEGER NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeatureLimit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingCustomer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "providerCustomerId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingCustomer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentVisibilitySetting" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "allowRecruiterContact" BOOLEAN NOT NULL DEFAULT false,
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "showResume" BOOLEAN NOT NULL DEFAULT false,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentVisibilitySetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountStatusLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountStatusLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");
CREATE UNIQUE INDEX "TeamInvitation_token_key" ON "TeamInvitation"("token");
CREATE UNIQUE INDEX "RecruiterProfile_userId_key" ON "RecruiterProfile"("userId");
CREATE UNIQUE INDEX "RecruiterApplication_recruiterJobId_studentProfileId_key" ON "RecruiterApplication"("recruiterJobId", "studentProfileId");
CREATE UNIQUE INDEX "CandidateShortlist_organizationId_recruiterJobId_studentProfileId_key" ON "CandidateShortlist"("organizationId", "recruiterJobId", "studentProfileId");
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX "FeatureLimit_planId_featureKey_key" ON "FeatureLimit"("planId", "featureKey");
CREATE UNIQUE INDEX "StudentVisibilitySetting_studentProfileId_key" ON "StudentVisibilitySetting"("studentProfileId");

CREATE INDEX "Organization_type_idx" ON "Organization"("type");
CREATE INDEX "Organization_status_idx" ON "Organization"("status");
CREATE INDEX "Organization_name_idx" ON "Organization"("name");
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");
CREATE INDEX "OrganizationMember_role_idx" ON "OrganizationMember"("role");
CREATE INDEX "OrganizationMember_status_idx" ON "OrganizationMember"("status");
CREATE INDEX "TeamInvitation_organizationId_idx" ON "TeamInvitation"("organizationId");
CREATE INDEX "TeamInvitation_email_idx" ON "TeamInvitation"("email");
CREATE INDEX "TeamInvitation_status_idx" ON "TeamInvitation"("status");
CREATE INDEX "RecruiterProfile_organizationId_idx" ON "RecruiterProfile"("organizationId");
CREATE INDEX "RecruiterProfile_verified_idx" ON "RecruiterProfile"("verified");
CREATE INDEX "RecruiterJob_organizationId_idx" ON "RecruiterJob"("organizationId");
CREATE INDEX "RecruiterJob_createdById_idx" ON "RecruiterJob"("createdById");
CREATE INDEX "RecruiterJob_status_idx" ON "RecruiterJob"("status");
CREATE INDEX "RecruiterJob_visibility_idx" ON "RecruiterJob"("visibility");
CREATE INDEX "RecruiterJob_deadline_idx" ON "RecruiterJob"("deadline");
CREATE INDEX "RecruiterApplication_recruiterJobId_idx" ON "RecruiterApplication"("recruiterJobId");
CREATE INDEX "RecruiterApplication_studentProfileId_idx" ON "RecruiterApplication"("studentProfileId");
CREATE INDEX "RecruiterApplication_status_idx" ON "RecruiterApplication"("status");
CREATE INDEX "CandidateView_recruiterId_idx" ON "CandidateView"("recruiterId");
CREATE INDEX "CandidateView_studentProfileId_idx" ON "CandidateView"("studentProfileId");
CREATE INDEX "CandidateView_organizationId_idx" ON "CandidateView"("organizationId");
CREATE INDEX "CandidateView_viewedAt_idx" ON "CandidateView"("viewedAt");
CREATE INDEX "CandidateShortlist_recruiterId_idx" ON "CandidateShortlist"("recruiterId");
CREATE INDEX "CandidateShortlist_organizationId_idx" ON "CandidateShortlist"("organizationId");
CREATE INDEX "CandidateShortlist_status_idx" ON "CandidateShortlist"("status");
CREATE INDEX "ContactRequest_recruiterId_idx" ON "ContactRequest"("recruiterId");
CREATE INDEX "ContactRequest_studentProfileId_idx" ON "ContactRequest"("studentProfileId");
CREATE INDEX "ContactRequest_organizationId_idx" ON "ContactRequest"("organizationId");
CREATE INDEX "ContactRequest_status_idx" ON "ContactRequest"("status");
CREATE INDEX "Plan_audience_idx" ON "Plan"("audience");
CREATE INDEX "Plan_active_idx" ON "Plan"("active");
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_providerPaymentId_idx" ON "Payment"("providerPaymentId");
CREATE INDEX "Payment_providerOrderId_idx" ON "Payment"("providerOrderId");
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");
CREATE INDEX "Invoice_paymentId_idx" ON "Invoice"("paymentId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "UsageRecord_organizationId_idx" ON "UsageRecord"("organizationId");
CREATE INDEX "UsageRecord_userId_idx" ON "UsageRecord"("userId");
CREATE INDEX "UsageRecord_featureKey_idx" ON "UsageRecord"("featureKey");
CREATE INDEX "UsageRecord_periodStart_periodEnd_idx" ON "UsageRecord"("periodStart", "periodEnd");
CREATE INDEX "FeatureLimit_featureKey_idx" ON "FeatureLimit"("featureKey");
CREATE INDEX "BillingCustomer_organizationId_idx" ON "BillingCustomer"("organizationId");
CREATE INDEX "BillingCustomer_userId_idx" ON "BillingCustomer"("userId");
CREATE INDEX "BillingCustomer_providerCustomerId_idx" ON "BillingCustomer"("providerCustomerId");
CREATE INDEX "StudentVisibilitySetting_visibility_idx" ON "StudentVisibilitySetting"("visibility");
CREATE INDEX "AccountStatusLog_organizationId_idx" ON "AccountStatusLog"("organizationId");
CREATE INDEX "AccountStatusLog_userId_idx" ON "AccountStatusLog"("userId");
CREATE INDEX "AccountStatusLog_action_idx" ON "AccountStatusLog"("action");
