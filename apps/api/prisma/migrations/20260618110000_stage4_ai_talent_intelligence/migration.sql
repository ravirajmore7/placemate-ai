CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "contextJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerMentorChat" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "studentProfileId" TEXT,
    "userId" TEXT,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "signalsJson" JSONB,
    "recommendationsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerMentorChat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlacementPrediction" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "placementProbability" INTEGER NOT NULL DEFAULT 0,
    "interviewSuccessProbability" INTEGER NOT NULL DEFAULT 0,
    "offerProbability" INTEGER NOT NULL DEFAULT 0,
    "salaryMinLpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salaryMaxLpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL,
    "factorsJson" JSONB,
    "recommendedActionsJson" JSONB,
    "modelVersion" TEXT NOT NULL DEFAULT 'stage4-local-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlacementPrediction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT,
    "userId" TEXT,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentScore" INTEGER NOT NULL DEFAULT 0,
    "metadataJson" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterviewQuestion" (
    "id" TEXT NOT NULL,
    "interviewSessionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "question" TEXT NOT NULL,
    "followUpsJson" JSONB,
    "evaluationCriteriaJson" JSONB,
    "expectedSignalsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterviewQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterviewEvaluation" (
    "id" TEXT NOT NULL,
    "interviewSessionId" TEXT NOT NULL,
    "communicationScore" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "technicalScore" INTEGER NOT NULL DEFAULT 0,
    "problemSolvingScore" INTEGER NOT NULL DEFAULT 0,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "feedbackJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterviewEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobEmbedding" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'recruiter_job',
    "jobId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "vectorJson" JSONB,
    "provider" TEXT NOT NULL DEFAULT 'local-hash',
    "dimensions" INTEGER NOT NULL DEFAULT 32,
    "embeddingHash" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateEmbedding" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "vectorJson" JSONB,
    "provider" TEXT NOT NULL DEFAULT 'local-hash',
    "dimensions" INTEGER NOT NULL DEFAULT 32,
    "embeddingHash" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CandidateEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResumeEmbedding" (
    "id" TEXT NOT NULL,
    "resumeAnalysisId" TEXT,
    "studentProfileId" TEXT,
    "text" TEXT NOT NULL,
    "vectorJson" JSONB,
    "provider" TEXT NOT NULL DEFAULT 'local-hash',
    "dimensions" INTEGER NOT NULL DEFAULT 32,
    "embeddingHash" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResumeEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoadmapPlan" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT,
    "userId" TEXT,
    "targetRole" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "planJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoadmapPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SkillGapAnalysis" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT,
    "recruiterJobId" TEXT,
    "driveId" TEXT,
    "query" TEXT,
    "missingSkillsJson" JSONB,
    "suggestedCertificationsJson" JSONB,
    "suggestedProjectsJson" JSONB,
    "roadmapJson" JSONB,
    "marketSkillsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillGapAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "roleCategory" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "questionsJson" JSONB NOT NULL,
    "evaluationConfigJson" JSONB,
    "createdById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentProfileId" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'started',
    "score" INTEGER NOT NULL DEFAULT 0,
    "answersJson" JSONB,
    "antiCheatLogsJson" JSONB,
    "evaluationJson" JSONB,
    "leaderboardRank" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioGeneration" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,
    "exportFormat" TEXT NOT NULL,
    "exportPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PortfolioGeneration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateRecommendation" (
    "id" TEXT NOT NULL,
    "recruiterJobId" TEXT,
    "driveId" TEXT,
    "recruiterId" TEXT,
    "studentProfileId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "hiringConfidence" INTEGER NOT NULL DEFAULT 0,
    "riskFactorsJson" JSONB,
    "missingSkillsJson" JSONB,
    "reasonsJson" JSONB,
    "source" TEXT NOT NULL DEFAULT 'ai_matching',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CandidateRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIUsageMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "role" TEXT,
    "featureKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'local',
    "model" TEXT NOT NULL DEFAULT 'stage4-local-v1',
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostInr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIUsageMetric_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIConversation_userId_idx" ON "AIConversation"("userId");
CREATE INDEX "AIConversation_role_idx" ON "AIConversation"("role");
CREATE INDEX "AIConversation_module_idx" ON "AIConversation"("module");
CREATE INDEX "AIConversation_status_idx" ON "AIConversation"("status");
CREATE INDEX "CareerMentorChat_conversationId_idx" ON "CareerMentorChat"("conversationId");
CREATE INDEX "CareerMentorChat_studentProfileId_idx" ON "CareerMentorChat"("studentProfileId");
CREATE INDEX "CareerMentorChat_userId_idx" ON "CareerMentorChat"("userId");
CREATE INDEX "CareerMentorChat_createdAt_idx" ON "CareerMentorChat"("createdAt");
CREATE INDEX "PlacementPrediction_studentProfileId_idx" ON "PlacementPrediction"("studentProfileId");
CREATE INDEX "PlacementPrediction_riskLevel_idx" ON "PlacementPrediction"("riskLevel");
CREATE INDEX "PlacementPrediction_createdAt_idx" ON "PlacementPrediction"("createdAt");
CREATE INDEX "InterviewSession_studentProfileId_idx" ON "InterviewSession"("studentProfileId");
CREATE INDEX "InterviewSession_userId_idx" ON "InterviewSession"("userId");
CREATE INDEX "InterviewSession_mode_idx" ON "InterviewSession"("mode");
CREATE INDEX "InterviewSession_status_idx" ON "InterviewSession"("status");
CREATE INDEX "InterviewQuestion_interviewSessionId_idx" ON "InterviewQuestion"("interviewSessionId");
CREATE INDEX "InterviewEvaluation_interviewSessionId_idx" ON "InterviewEvaluation"("interviewSessionId");
CREATE INDEX "InterviewEvaluation_overallScore_idx" ON "InterviewEvaluation"("overallScore");
CREATE UNIQUE INDEX "JobEmbedding_provider_embeddingHash_key" ON "JobEmbedding"("provider", "embeddingHash");
CREATE INDEX "JobEmbedding_jobId_idx" ON "JobEmbedding"("jobId");
CREATE INDEX "JobEmbedding_sourceType_idx" ON "JobEmbedding"("sourceType");
CREATE UNIQUE INDEX "CandidateEmbedding_provider_embeddingHash_key" ON "CandidateEmbedding"("provider", "embeddingHash");
CREATE INDEX "CandidateEmbedding_studentProfileId_idx" ON "CandidateEmbedding"("studentProfileId");
CREATE UNIQUE INDEX "ResumeEmbedding_provider_embeddingHash_key" ON "ResumeEmbedding"("provider", "embeddingHash");
CREATE INDEX "ResumeEmbedding_resumeAnalysisId_idx" ON "ResumeEmbedding"("resumeAnalysisId");
CREATE INDEX "ResumeEmbedding_studentProfileId_idx" ON "ResumeEmbedding"("studentProfileId");
CREATE INDEX "RoadmapPlan_studentProfileId_idx" ON "RoadmapPlan"("studentProfileId");
CREATE INDEX "RoadmapPlan_userId_idx" ON "RoadmapPlan"("userId");
CREATE INDEX "RoadmapPlan_targetRole_idx" ON "RoadmapPlan"("targetRole");
CREATE INDEX "RoadmapPlan_status_idx" ON "RoadmapPlan"("status");
CREATE INDEX "SkillGapAnalysis_studentProfileId_idx" ON "SkillGapAnalysis"("studentProfileId");
CREATE INDEX "SkillGapAnalysis_recruiterJobId_idx" ON "SkillGapAnalysis"("recruiterJobId");
CREATE INDEX "SkillGapAnalysis_driveId_idx" ON "SkillGapAnalysis"("driveId");
CREATE INDEX "SkillGapAnalysis_createdAt_idx" ON "SkillGapAnalysis"("createdAt");
CREATE INDEX "Assessment_type_idx" ON "Assessment"("type");
CREATE INDEX "Assessment_roleCategory_idx" ON "Assessment"("roleCategory");
CREATE INDEX "Assessment_status_idx" ON "Assessment"("status");
CREATE INDEX "Assessment_createdById_idx" ON "Assessment"("createdById");
CREATE INDEX "AssessmentAttempt_assessmentId_idx" ON "AssessmentAttempt"("assessmentId");
CREATE INDEX "AssessmentAttempt_studentProfileId_idx" ON "AssessmentAttempt"("studentProfileId");
CREATE INDEX "AssessmentAttempt_userId_idx" ON "AssessmentAttempt"("userId");
CREATE INDEX "AssessmentAttempt_status_idx" ON "AssessmentAttempt"("status");
CREATE INDEX "AssessmentAttempt_score_idx" ON "AssessmentAttempt"("score");
CREATE INDEX "PortfolioGeneration_studentProfileId_idx" ON "PortfolioGeneration"("studentProfileId");
CREATE INDEX "PortfolioGeneration_userId_idx" ON "PortfolioGeneration"("userId");
CREATE INDEX "PortfolioGeneration_type_idx" ON "PortfolioGeneration"("type");
CREATE INDEX "CandidateRecommendation_recruiterJobId_idx" ON "CandidateRecommendation"("recruiterJobId");
CREATE INDEX "CandidateRecommendation_driveId_idx" ON "CandidateRecommendation"("driveId");
CREATE INDEX "CandidateRecommendation_recruiterId_idx" ON "CandidateRecommendation"("recruiterId");
CREATE INDEX "CandidateRecommendation_studentProfileId_idx" ON "CandidateRecommendation"("studentProfileId");
CREATE INDEX "CandidateRecommendation_matchScore_idx" ON "CandidateRecommendation"("matchScore");
CREATE INDEX "AIUsageMetric_userId_idx" ON "AIUsageMetric"("userId");
CREATE INDEX "AIUsageMetric_organizationId_idx" ON "AIUsageMetric"("organizationId");
CREATE INDEX "AIUsageMetric_role_idx" ON "AIUsageMetric"("role");
CREATE INDEX "AIUsageMetric_featureKey_idx" ON "AIUsageMetric"("featureKey");
CREATE INDEX "AIUsageMetric_createdAt_idx" ON "AIUsageMetric"("createdAt");
