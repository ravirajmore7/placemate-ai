import { DriveStatus, JobType } from "@prisma/client";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min
} from "class-validator";

export class CreateDriveDto {
  @IsString()
  companyName!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  companyWebsite?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companyDescription?: string;

  @IsString()
  role!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ctc?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stipend?: number;

  @IsString()
  location!: string;

  @IsEnum(JobType)
  jobType!: JobType;

  @IsArray()
  @IsString({ each: true })
  eligibleBranches!: string[];

  @IsNumber()
  @Min(0)
  minimumCgpa!: number;

  @IsInt()
  @Min(0)
  maxBacklogs!: number;

  @IsArray()
  @IsString({ each: true })
  requiredSkills!: string[];

  @IsDateString()
  applicationDeadline!: string;

  @IsOptional()
  @IsDateString()
  testDate?: string;

  @IsOptional()
  @IsDateString()
  interviewDate?: string;

  @IsOptional()
  @IsEnum(DriveStatus)
  status?: DriveStatus;
}
