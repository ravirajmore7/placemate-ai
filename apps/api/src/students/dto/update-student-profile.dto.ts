import { PlacementStatus } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min
} from "class-validator";

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  collegeName?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  year?: number;

  @IsOptional()
  @IsInt()
  graduationYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  cgpa?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  activeBacklogs?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCompanies?: string[];

  @IsOptional()
  @IsString()
  preferredLocation?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedSalary?: number;

  @IsOptional()
  @IsEnum(PlacementStatus)
  placementStatus?: PlacementStatus;
}
