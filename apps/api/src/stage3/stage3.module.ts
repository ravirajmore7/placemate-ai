import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminSaasController } from "./admin-saas.controller";
import { CollegeController } from "./college.controller";
import { CompanyController } from "./company.controller";
import { BillingController, PlansController, RazorpayPaymentsController, UsageController, WebhooksController } from "./plans-billing.controller";
import { RecruiterController } from "./recruiter.controller";
import { Stage3Service } from "./stage3.service";
import { StudentStage3Controller } from "./student-stage3.controller";

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminSaasController,
    BillingController,
    CollegeController,
    CompanyController,
    PlansController,
    RazorpayPaymentsController,
    RecruiterController,
    StudentStage3Controller,
    UsageController,
    WebhooksController
  ],
  providers: [Stage3Service],
  exports: [Stage3Service]
})
export class Stage3Module {}
