# PlaceMate AI / SkillProof AI

Stage 1 market-ready SaaS foundation for a smart placement tracker. The product supports students, TPO admins, and super admins with auth, placement profiles, readiness scoring, company drives, eligibility checks, applications, shortlists, and analytics.

## Features

- JWT auth with role-based access for `STUDENT`, `TPO_ADMIN`, and `SUPER_ADMIN`
- Student placement profile with personal, academic, career, skill, project, education, resume, and coding profile data
- Rule-based readiness score out of 100 with suggestions
- TPO company drive creation and management
- Eligibility checker for CGPA, branch, backlogs, and required skills
- Student applications and TPO status updates
- Student, TPO, and Super Admin dashboards with charts
- Prisma/PostgreSQL schema ready for Stage 2 AI and integrations
- FastAPI placeholder service for future resume analysis, job matching, and coding profile analysis

## Tech Stack

- Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui-style components, Framer Motion, Lucide, Recharts, TanStack Query, TanStack Table, Zustand
- Backend: NestJS, TypeScript, Prisma ORM, PostgreSQL, REST APIs, JWT auth, RBAC
- AI Service: Python FastAPI placeholder
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
- `AI_SERVICE_URL`: backend URL for the placeholder AI service

## Local Setup

```bash
cd placemate-ai
npm install
docker compose up -d postgres
npm run db:generate
npm run db:migrate -- --name init
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
npm run db:migrate -- --name init
npm run db:seed
```

Prisma schema lives at:

```text
apps/api/prisma/schema.prisma
```

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

Super Admin:

- `GET /admin/stats`
- `GET /admin/users`

AI placeholder:

- `GET /`
- `POST /analyze-resume`
- `POST /calculate-readiness`
- `POST /match-job`
- `POST /analyze-github`
- `POST /analyze-leetcode`
- `POST /analyze-hackerrank`

## Demo Login Credentials

All demo users use:

```text
Password@123
```

Accounts:

- Student: `student1@placemate.ai`
- TPO Admin: `tpo@placemate.ai`
- Super Admin: `admin@placemate.ai`

## Stage 1 Scope Notes

This stage intentionally does not include real AI analysis, payments, WhatsApp, GitHub OAuth, LeetCode sync, HackerRank sync, recruiter portal, or cloud file storage. Resume upload is a URL/path placeholder and coding profile connections store usernames only.

## Future Roadmap

- GitHub OAuth and repository analysis
- LeetCode and HackerRank public profile sync
- AI resume analyzer and JD-resume matching
- Qdrant vector database for semantic matching
- Recruiter portal and interview workflow
- Razorpay subscriptions and college onboarding
- Cloudflare R2 or AWS S3 resume storage
- Advanced analytics, exports, and cohort benchmarking
