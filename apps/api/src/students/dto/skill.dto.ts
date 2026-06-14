import { IsInt, IsString, Max, Min } from "class-validator";

export class SkillDto {
  @IsString()
  name!: string;

  @IsString()
  category!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  level!: number;
}
