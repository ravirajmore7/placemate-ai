import { Module } from "@nestjs/common";
import { JobsModule } from "../jobs/jobs.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AiStage2Controller } from "./ai-stage2.controller";
import { IntegrationsController } from "./integrations.controller";
import { MatchesController } from "./matches.controller";
import { RoadmapsController } from "./roadmaps.controller";
import { SkillProofController } from "./skillproof.controller";
import { Stage2ReportsController } from "./stage2-reports.controller";
import { Stage2Service } from "./stage2.service";

@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [
    IntegrationsController,
    AiStage2Controller,
    SkillProofController,
    MatchesController,
    RoadmapsController,
    Stage2ReportsController
  ],
  providers: [Stage2Service],
  exports: [Stage2Service]
})
export class Stage2Module {}
