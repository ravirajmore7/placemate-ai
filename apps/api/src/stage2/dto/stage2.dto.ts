import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength
} from "class-validator";

export class UsernameSyncDto {
  @IsString()
  @MinLength(2)
  username!: string;

  @IsOptional()
  @IsBoolean()
  consentAccepted?: boolean;
}

export class LeetCodeManualDto {
  @IsString()
  @MinLength(2)
  username!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalSolved?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  easySolved?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mediumSolved?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hardSolved?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ranking?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  contestRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  acceptanceRate?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];
}

export class HackerRankManualDto {
  @IsString()
  @MinLength(2)
  username!: string;

  @IsOptional()
  @IsString()
  profileUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  problemSolvingScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  pythonScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  javaScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  sqlScore?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsArray()
  testScores?: Record<string, unknown>[];
}

export class HackerRankCsvDto {
  @IsOptional()
  @IsString()
  csv?: string;

  @IsOptional()
  @IsArray()
  rows?: Record<string, unknown>[];
}

export class ResumeAnalyzeDto {
  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @IsOptional()
  @IsString()
  resumeText?: string;
}

export class TextAnalyzeDto {
  @IsString()
  @MinLength(3)
  text!: string;
}

export class JobAnalyzeDto {
  @IsOptional()
  @IsString()
  jobDescription?: string;
}

export class RoadmapGenerateDto {
  @IsOptional()
  @IsString()
  driveId?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @Type(() => Number)
  @IsInt()
  @IsIn([7, 15, 30, 60])
  durationDays!: number;
}

export class CompleteTaskDto {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
