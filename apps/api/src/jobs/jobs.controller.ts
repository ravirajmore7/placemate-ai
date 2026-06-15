import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { JobsService } from "./jobs.service";

@Controller("jobs")
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get(":id")
  get(@Param("id") id: string) {
    return this.jobs.get(id);
  }
}
