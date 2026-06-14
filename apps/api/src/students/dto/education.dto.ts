import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class EducationDto {
  @IsString()
  degree!: string;

  @IsString()
  institute!: string;

  @IsInt()
  @Min(1900)
  startYear!: number;

  @IsOptional()
  @IsInt()
  endYear?: number;

  @IsOptional()
  @IsString()
  score?: string;
}
