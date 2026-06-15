import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";

export type JobState = "queued" | "processing" | "completed" | "failed";

export type JobStatus = {
  id: string;
  type: string;
  status: JobState;
  progress: number;
  resultJson?: unknown;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

type JobRunner = (setProgress: (progress: number) => void) => Promise<unknown>;

@Injectable()
export class JobsService {
  private readonly jobs = new Map<string, JobStatus>();

  enqueue(type: string, runner: JobRunner): JobStatus {
    const now = new Date().toISOString();
    const job: JobStatus = {
      id: randomUUID(),
      type,
      status: "queued",
      progress: 0,
      createdAt: now,
      updatedAt: now
    };

    this.jobs.set(job.id, job);

    setTimeout(() => {
      void this.run(job.id, runner);
    }, 0);

    return job;
  }

  get(id: string): JobStatus {
    const job = this.jobs.get(id);
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    return job;
  }

  private async run(id: string, runner: JobRunner) {
    this.patch(id, { status: "processing", progress: 5 });
    try {
      const result = await runner((progress) => this.patch(id, { progress }));
      this.patch(id, {
        status: "completed",
        progress: 100,
        resultJson: result
      });
    } catch (error) {
      this.patch(id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Job failed"
      });
    }
  }

  private patch(id: string, patch: Partial<JobStatus>) {
    const current = this.jobs.get(id);
    if (!current) return;
    this.jobs.set(id, {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    });
  }
}
