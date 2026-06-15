-- CreateTable
CREATE TABLE "GitHubProfile" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "profileUrl" TEXT,
    "publicRepos" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "githubScore" INTEGER NOT NULL DEFAULT 0,
    "strengthsJson" JSONB,
    "weaknessesJson" JSONB,
    "suggestionsJson" JSONB,
    "rawDataJson" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubRepository" (
    "id" TEXT NOT NULL,
    "githubProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "primaryLanguage" TEXT,
    "languagesJson" JSONB,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "openIssues" INTEGER NOT NULL DEFAULT 0,
    "hasReadme" BOOLEAN NOT NULL DEFAULT false,
    "hasLiveDemo" BOOLEAN NOT NULL DEFAULT false,
    "topicsJson" JSONB,
    "lastUpdatedAt" TIMESTAMP(3),
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeetCodeProfile" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileUrl" TEXT,
    "totalSolved" INTEGER NOT NULL DEFAULT 0,
    "easySolved" INTEGER NOT NULL DEFAULT 0,
    "mediumSolved" INTEGER NOT NULL DEFAULT 0,
    "hardSolved" INTEGER NOT NULL DEFAULT 0,
    "ranking" INTEGER,
    "contestRating" DOUBLE PRECISION,
    "acceptanceRate" DOUBLE PRECISION,
    "badgesJson" JSONB,
    "topicStatsJson" JSONB,
    "leetcodeScore" INTEGER NOT NULL DEFAULT 0,
    "strengthsJson" JSONB,
    "weaknessesJson" JSONB,
    "suggestionsJson" JSONB,
    "rawDataJson" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeetCodeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HackerRankProfile" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileUrl" TEXT,
    "problemSolvingScore" INTEGER NOT NULL DEFAULT 0,
    "pythonScore" INTEGER NOT NULL DEFAULT 0,
    "javaScore" INTEGER NOT NULL DEFAULT 0,
    "sqlScore" INTEGER NOT NULL DEFAULT 0,
    "certificationsJson" JSONB,
    "testScoresJson" JSONB,
    "hackerRankScore" INTEGER NOT NULL DEFAULT 0,
    "strengthsJson" JSONB,
    "weaknessesJson" JSONB,
    "suggestionsJson" JSONB,
    "rawDataJson" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HackerRankProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeAnalysis" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "extractedText" TEXT,
    "detectedSkillsJson" JSONB,
    "missingSectionsJson" JSONB,
    "weakPointsJson" JSONB,
    "suggestionsJson" JSONB,
    "atsScore" INTEGER NOT NULL DEFAULT 0,
    "resumeScore" INTEGER NOT NULL DEFAULT 0,
    "contactScore" INTEGER NOT NULL DEFAULT 0,
    "educationScore" INTEGER NOT NULL DEFAULT 0,
    "skillsScore" INTEGER NOT NULL DEFAULT 0,
    "projectsScore" INTEGER NOT NULL DEFAULT 0,
    "experienceScore" INTEGER NOT NULL DEFAULT 0,
    "formattingScore" INTEGER NOT NULL DEFAULT 0,
    "impactScore" INTEGER NOT NULL DEFAULT 0,
    "linksScore" INTEGER NOT NULL DEFAULT 0,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDescriptionAnalysis" (
    "id" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "extractedSkillsJson" JSONB,
    "requiredSkillsJson" JSONB,
    "preferredSkillsJson" JSONB,
    "roleCategory" TEXT,
    "difficultyLevel" TEXT,
    "keywordsJson" JSONB,
    "analysisJson" JSONB,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDescriptionAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillProofScore" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL,
    "placementReadinessScore" INTEGER NOT NULL DEFAULT 0,
    "resumeScore" INTEGER NOT NULL DEFAULT 0,
    "githubScore" INTEGER NOT NULL DEFAULT 0,
    "leetcodeScore" INTEGER NOT NULL DEFAULT 0,
    "hackerRankScore" INTEGER NOT NULL DEFAULT 0,
    "projectScore" INTEGER NOT NULL DEFAULT 0,
    "skillVerificationScore" INTEGER NOT NULL DEFAULT 0,
    "breakdownJson" JSONB,
    "suggestionsJson" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillProofScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillVerification" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "proofLevel" TEXT NOT NULL,
    "sourcesJson" JSONB,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "suggestion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMatchResult" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "matchedSkillsJson" JSONB,
    "missingSkillsJson" JSONB,
    "weakSkillsJson" JSONB,
    "strongProofSkillsJson" JSONB,
    "reasonsJson" JSONB,
    "suggestionsJson" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillGap" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "gapType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRoadmap" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "driveId" TEXT,
    "title" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "goal" TEXT NOT NULL,
    "roadmapJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapTask" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubProfile_studentProfileId_key" ON "GitHubProfile"("studentProfileId");

-- CreateIndex
CREATE INDEX "GitHubProfile_username_idx" ON "GitHubProfile"("username");

-- CreateIndex
CREATE INDEX "GitHubProfile_githubScore_idx" ON "GitHubProfile"("githubScore");

-- CreateIndex
CREATE INDEX "GitHubRepository_githubProfileId_idx" ON "GitHubRepository"("githubProfileId");

-- CreateIndex
CREATE INDEX "GitHubRepository_primaryLanguage_idx" ON "GitHubRepository"("primaryLanguage");

-- CreateIndex
CREATE INDEX "GitHubRepository_qualityScore_idx" ON "GitHubRepository"("qualityScore");

-- CreateIndex
CREATE UNIQUE INDEX "LeetCodeProfile_studentProfileId_key" ON "LeetCodeProfile"("studentProfileId");

-- CreateIndex
CREATE INDEX "LeetCodeProfile_username_idx" ON "LeetCodeProfile"("username");

-- CreateIndex
CREATE INDEX "LeetCodeProfile_leetcodeScore_idx" ON "LeetCodeProfile"("leetcodeScore");

-- CreateIndex
CREATE UNIQUE INDEX "HackerRankProfile_studentProfileId_key" ON "HackerRankProfile"("studentProfileId");

-- CreateIndex
CREATE INDEX "HackerRankProfile_username_idx" ON "HackerRankProfile"("username");

-- CreateIndex
CREATE INDEX "HackerRankProfile_hackerRankScore_idx" ON "HackerRankProfile"("hackerRankScore");

-- CreateIndex
CREATE INDEX "ResumeAnalysis_studentProfileId_idx" ON "ResumeAnalysis"("studentProfileId");

-- CreateIndex
CREATE INDEX "ResumeAnalysis_resumeScore_idx" ON "ResumeAnalysis"("resumeScore");

-- CreateIndex
CREATE INDEX "ResumeAnalysis_analyzedAt_idx" ON "ResumeAnalysis"("analyzedAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobDescriptionAnalysis_driveId_key" ON "JobDescriptionAnalysis"("driveId");

-- CreateIndex
CREATE INDEX "JobDescriptionAnalysis_difficultyLevel_idx" ON "JobDescriptionAnalysis"("difficultyLevel");

-- CreateIndex
CREATE INDEX "JobDescriptionAnalysis_roleCategory_idx" ON "JobDescriptionAnalysis"("roleCategory");

-- CreateIndex
CREATE INDEX "SkillProofScore_studentProfileId_idx" ON "SkillProofScore"("studentProfileId");

-- CreateIndex
CREATE INDEX "SkillProofScore_overallScore_idx" ON "SkillProofScore"("overallScore");

-- CreateIndex
CREATE INDEX "SkillProofScore_calculatedAt_idx" ON "SkillProofScore"("calculatedAt");

-- CreateIndex
CREATE INDEX "SkillVerification_proofLevel_idx" ON "SkillVerification"("proofLevel");

-- CreateIndex
CREATE UNIQUE INDEX "SkillVerification_studentProfileId_skillName_key" ON "SkillVerification"("studentProfileId", "skillName");

-- CreateIndex
CREATE INDEX "JobMatchResult_driveId_idx" ON "JobMatchResult"("driveId");

-- CreateIndex
CREATE INDEX "JobMatchResult_matchScore_idx" ON "JobMatchResult"("matchScore");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatchResult_studentProfileId_driveId_key" ON "JobMatchResult"("studentProfileId", "driveId");

-- CreateIndex
CREATE INDEX "SkillGap_studentProfileId_idx" ON "SkillGap"("studentProfileId");

-- CreateIndex
CREATE INDEX "SkillGap_driveId_idx" ON "SkillGap"("driveId");

-- CreateIndex
CREATE INDEX "SkillGap_skillName_idx" ON "SkillGap"("skillName");

-- CreateIndex
CREATE INDEX "SkillGap_priority_idx" ON "SkillGap"("priority");

-- CreateIndex
CREATE INDEX "StudentRoadmap_studentProfileId_idx" ON "StudentRoadmap"("studentProfileId");

-- CreateIndex
CREATE INDEX "StudentRoadmap_driveId_idx" ON "StudentRoadmap"("driveId");

-- CreateIndex
CREATE INDEX "StudentRoadmap_status_idx" ON "StudentRoadmap"("status");

-- CreateIndex
CREATE INDEX "RoadmapTask_roadmapId_idx" ON "RoadmapTask"("roadmapId");

-- CreateIndex
CREATE INDEX "RoadmapTask_completed_idx" ON "RoadmapTask"("completed");

-- CreateIndex
CREATE INDEX "RoadmapTask_category_idx" ON "RoadmapTask"("category");

-- AddForeignKey
ALTER TABLE "GitHubProfile" ADD CONSTRAINT "GitHubProfile_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubRepository" ADD CONSTRAINT "GitHubRepository_githubProfileId_fkey" FOREIGN KEY ("githubProfileId") REFERENCES "GitHubProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeetCodeProfile" ADD CONSTRAINT "LeetCodeProfile_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackerRankProfile" ADD CONSTRAINT "HackerRankProfile_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeAnalysis" ADD CONSTRAINT "ResumeAnalysis_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDescriptionAnalysis" ADD CONSTRAINT "JobDescriptionAnalysis_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillProofScore" ADD CONSTRAINT "SkillProofScore_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillVerification" ADD CONSTRAINT "SkillVerification_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatchResult" ADD CONSTRAINT "JobMatchResult_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatchResult" ADD CONSTRAINT "JobMatchResult_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGap" ADD CONSTRAINT "SkillGap_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGap" ADD CONSTRAINT "SkillGap_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRoadmap" ADD CONSTRAINT "StudentRoadmap_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRoadmap" ADD CONSTRAINT "StudentRoadmap_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapTask" ADD CONSTRAINT "RoadmapTask_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "StudentRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

