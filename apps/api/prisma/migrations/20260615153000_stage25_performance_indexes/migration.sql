CREATE INDEX IF NOT EXISTS "StudentProfile_activeBacklogs_idx" ON "StudentProfile"("activeBacklogs");
CREATE INDEX IF NOT EXISTS "StudentProfile_placementStatus_idx" ON "StudentProfile"("placementStatus");

CREATE INDEX IF NOT EXISTS "Drive_minimumCgpa_idx" ON "Drive"("minimumCgpa");
CREATE INDEX IF NOT EXISTS "Drive_createdById_idx" ON "Drive"("createdById");
CREATE INDEX IF NOT EXISTS "Drive_companyId_idx" ON "Drive"("companyId");

CREATE INDEX IF NOT EXISTS "Application_studentProfileId_idx" ON "Application"("studentProfileId");
CREATE INDEX IF NOT EXISTS "Application_driveId_idx" ON "Application"("driveId");
CREATE INDEX IF NOT EXISTS "Application_appliedAt_idx" ON "Application"("appliedAt");

CREATE INDEX IF NOT EXISTS "JobMatchResult_studentProfileId_idx" ON "JobMatchResult"("studentProfileId");
