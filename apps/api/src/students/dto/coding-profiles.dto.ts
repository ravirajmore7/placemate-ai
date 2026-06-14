import { IsOptional, IsString } from "class-validator";

export class CodingProfilesDto {
  @IsOptional()
  @IsString()
  githubUsername?: string;

  @IsOptional()
  @IsString()
  leetcodeUsername?: string;

  @IsOptional()
  @IsString()
  hackerrankUsername?: string;
}
