import { IsString } from "class-validator";

export class ResumeDto {
  @IsString()
  resumeUrl!: string;
}
