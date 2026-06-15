# PlaceMate AI / SkillProof AI

Stage 1 + Stage 2 SaaS foundation for a smart placement intelligence platform. The product supports students, TPO admins, and super admins with auth, placement profiles, readiness scoring, company drives, eligibility checks, applications, shortlists, analytics, and the Stage 2 SkillProof AI Intelligence Layer.

Stage 2 converts GitHub, LeetCode, HackerRank, resume, project, and job-description signals into verified skill intelligence, company-wise fit scores, skill gap analysis, and personalized improvement roadmaps.

## Features

- JWT auth with role-based access for `STUDENT`, `TPO_ADMIN`, and `SUPER_ADMIN`
- Student placement profile with personal, academic, career, skill, project, education, resume, and coding profile data
- Rule-based readiness score out of 100 with suggestions
- TPO company drive creation and management
- Eligibility checker for CGPA, branch, backlogs, and required skills
- Student applications and TPO status updates
- Student, TPO, and Super Admin dashboards with charts
- SkillProof AI dashboard with transparent score breakdowns
- GitHub public profile analysis with repository quality, README, deployment, language, and activity signals
- LeetCode analysis with public sync attempt plus manual fallback
- HackerRank manual/TPO CSV proof support
- FastAPI resume analyzer with skill extraction, ATS scoring, weak points, and suggestions
- Job-description skill extraction and resume-to-JD/company fit matching
- Fake skill detection via proof levels across resume, GitHub, projects, and coding profiles
- Student improvement roadmaps with task completion
- TPO Stage 2 reports for top students, weak skills, company fit, and skill gaps

## Tech Stack

- Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui-style components, Framer Motion, Lucide, Recharts, TanStack Query, TanStack Table, Zustand
- Backend: NestJS, TypeScript, Prisma ORM, PostgreSQL, REST APIs, JWT auth, RBAC
- AI Service: Python FastAPI analyzer for resume, JD, match, SkillProof, fake-skill detection, and roadmaps
- Local infra: Docker Compose with PostgreSQL, API, web, and AI service

## Folder Structure

```text
placemate-ai/
  apps/
    web/          Next.js frontend
    api/          NestJS REST API and Prisma schema
    ai-service/   FastAPI placeholder service
  packages/
    shared/       Shared constants/types
  docker-compose.yml
  .env.example
  README.md
```

## Environment Variables

Copy the root example:

```bash
cp .env.example .env
```

Important variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: long random secret for signing JWTs
- `JWT_EXPIRES_IN`: token lifetime, defaults to `7d`
- `NEXT_PUBLIC_API_URL`: frontend API URL
- `AI_SERVICE_URL`: backend URL for the FastAPI SkillProof AI service
- `GITHUB_TOKEN`: optional GitHub API token to raise public API rate limits
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`: reserved for future GitHub OAuth
- `REDIS_URL`: reserved for future BullMQ sync jobs
- `QDRANT_URL` / `QDRANT_API_KEY`: reserved for future vector matching
- `RESUME_UPLOAD_MAX_SIZE`: max resume upload size expected by future storage layer
- `ENABLE_LEETCODE_SYNC`: enables LeetCode public sync attempt with fallback
- `ENABLE_HACKERRANK_SYNC`: reserved for future HackerRank API sync

## Local Setup

```bash
cd placemate-ai
npm install
docker compose up -d postgres
npm run db:generate
npm run db:migrate -- --name stage2_skillproof
npm run db:seed
npm run dev:api
npm run dev:web
```

Open:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- AI service if run separately: `http://localhost:8001`

## Docker Setup

```bash
cd placemate-ai
docker compose up --build
```

The API container runs `prisma db push` on startup for local Docker convenience. To seed demo data into the Docker database:

```bash
docker compose exec api npm run prisma:seed
```

Then open `http://localhost:3000`.

## Database Commands

```bash
npm run db:generate
npm run db:migrate -- --name stage2_skillproof
npm run db:seed
```

Prisma schema lives at:

```text
apps/api/prisma/schema.prisma
```

Stage 2 includes an additive Prisma migration at:

```text
apps/api/prisma/migrations/20260615143000_stage2_skillproof_intelligence/migration.sql
```

If you already created a local Stage 1 database with `prisma db push`, run `npm run db:migrate` on a clean database or use `npx prisma db push` for local development, then reseed with `npm run db:seed`.

## API Overview

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Students:

- `GET /students/me`
- `PUT /students/me`
- `GET /students/me/readiness`
- `POST /students/me/skills`
- `PUT /students/me/skills/:id`
- `DELETE /students/me/skills/:id`
- `POST /students/me/projects`
- `PUT /students/me/projects/:id`
- `DELETE /students/me/projects/:id`
- `POST /students/me/education`
- `PUT /students/me/education/:id`
- `DELETE /students/me/education/:id`
- `POST /students/me/resume`
- `POST /students/me/coding-profiles`

Drives:

- `GET /drives`
- `GET /drives/:id`
- `POST /drives`
- `PUT /drives/:id`
- `DELETE /drives/:id`
- `GET /drives/:id/eligibility`

Applications:

- `POST /applications`
- `GET /applications/me`
- `GET /applications`
- `PUT /applications/:id/status`

TPO:

- `GET /tpo/dashboard`
- `GET /tpo/students`
- `GET /tpo/students/:id`
- `GET /tpo/drives/:id/eligible-students`
- `GET /tpo/reports`
- `GET /tpo/reports/skill-gap`
- `GET /tpo/reports/top-students`
- `GET /tpo/reports/company-fit/:driveId`
- `GET /tpo/reports/weak-skills`
- `GET /tpo/reports/platform-readiness`

Super Admin:

- `GET /admin/stats`
- `GET /admin/users`

Stage 2 integrations:

- `POST /integrations/github/sync`
- `GET /integrations/github/me`
- `GET /integrations/github/repositories`
- `GET /integrations/github/score`
- `POST /integrations/leetcode/sync`
- `POST /integrations/leetcode/manual`
- `GET /integrations/leetcode/me`
- `GET /integrations/leetcode/score`
- `POST /integrations/hackerrank/sync`
- `POST /integrations/hackerrank/manual`
- `POST /integrations/hackerrank/upload-csv`
- `GET /integrations/hackerrank/me`
- `GET /integrations/hackerrank/score`

Stage 2 AI and SkillProof:

- `POST /ai/resume/analyze`
- `GET /ai/resume/latest`
- `GET /ai/resume/score`
- `POST /ai/extract-skills`
- `POST /ai/jobs/:driveId/analyze`
- `GET /ai/jobs/:driveId/analysis`
- `POST /skillproof/calculate`
- `GET /skillproof/me`
- `GET /skillproof/history`
- `GET /skillproof/verification`
- `POST /matches/drive/:driveId/calculate`
- `GET /matches/drive/:driveId/me`
- `GET /matches/student/:studentId`
- `GET /matches/drive/:driveId/recommended-students`
- `POST /roadmaps/generate`
- `GET /roadmaps/me`
- `GET /roadmaps/:id`
- `PUT /roadmaps/tasks/:taskId/complete`

FastAPI SkillProof AI service:

- `GET /`
- `POST /analyze-resume`
- `POST /extract-skills`
- `POST /analyze-job-description`
- `POST /match-resume-with-jd`
- `POST /calculate-skillproof-score`
- `POST /detect-fake-skills`
- `POST /generate-roadmap`
- Compatibility aliases: `POST /calculate-readiness`, `POST /match-job`

## Stage 2 Data Models

Stage 2 extends the existing schema with:

- `GitHubProfile` and `GitHubRepository`
- `LeetCodeProfile`
- `HackerRankProfile`
- `ResumeAnalysis`
- `JobDescriptionAnalysis`
- `SkillProofScore`
- `SkillVerification`
- `JobMatchResult`
- `SkillGap`
- `StudentRoadmap` and `RoadmapTask`

Existing Stage 1 models are preserved.

## Stage 2 Student Flow

1. Log in as a student.
2. Open `SkillProof AI` from the sidebar.
3. Sync GitHub or use fallback/manual coding profile pages.
4. Analyze resume text from `Resume AI`.
5. View SkillProof score and skill verification proof levels.
6. Open `Company Fit` to compare your profile with a drive.
7. Generate a 7, 15, 30, or 60 day roadmap and complete tasks.

## Stage 2 TPO Flow

1. Log in as TPO.
2. Review dashboard Stage 2 cards: average SkillProof, strong GitHub, strong LeetCode, weak resume, weak DSA.
3. Open `Top Students`, `Skill Gaps`, `Drive Recommendations`, or `Weak Skills`.
4. Select a drive in company-fit reports to view recommended students by match score.

## Scoring Rules

All Stage 2 scores are explainable:

- SkillProof = readiness 20%, resume 20%, GitHub 15%, LeetCode 15%, HackerRank 10%, project quality 10%, skill verification 10%.
- Company fit = required skill match, project relevance, resume keyword/ATS signal, coding profile strength, academic eligibility, and proof quality.
- Proof levels: `Strong Proof`, `Medium Proof`, `Weak Proof`, `No Proof Found`.
- Levels: `Beginner`, `Improving`, `Placement Ready`, `Highly Competitive`.

## Known Limitations

- GitHub uses public username sync. OAuth variables are reserved for future implementation.
- LeetCode public sync can be unavailable or blocked, so manual fallback is first-class.
- HackerRank has limited public profile access, so manual/TPO CSV proof is supported.
- Resume upload storage is still URL/text based; cloud object storage can replace it later.
- Redis/BullMQ and Qdrant are architecture-ready but not required for this stage.

## Demo Login Credentials

All demo users use:

```text
Password@123
```

Accounts:

- Student: `student1@placemate.ai`
- TPO Admin: `tpo@placemate.ai`
- Super Admin: `admin@placemate.ai`

## Scope Notes

Stage 2 intentionally does not include payments, WhatsApp, mobile apps, full recruiter portal, AI mock interviews, enterprise onboarding, or production Qdrant/BullMQ deployment. External platform passwords are never requested or stored.

## Future Roadmap

- GitHub OAuth account connection
- Production background sync with Redis and BullMQ
- Qdrant vector database for semantic matching
- Cloud resume upload with virus scanning and retention controls
- Recruiter portal and interview workflow
- Razorpay subscriptions and college onboarding
- Cloudflare R2 or AWS S3 resume storage
- Advanced analytics, exports, and cohort benchmarking
- AI mock interview and recruiter-ready verified student snapshots
