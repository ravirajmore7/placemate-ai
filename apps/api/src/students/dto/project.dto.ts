import { IsArray, IsDateString, IsOptional, IsString, IsUrl } from "class-validator";

export class ProjectDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  techStack!: string[];

  @IsOptional()
  @IsUrl({ require_protocol: true })
  githubUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  liveUrl?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
