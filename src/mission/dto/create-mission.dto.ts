import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateMissionDto {
  @IsString()
  title: string;

  @IsString()
  slug: string; // যেমন: 'daily_posts', 'daily_favorites'

  @IsInt()
  @Min(0)
  xpReward: number;

  @IsInt()
  @Min(1)
  requirementCount: number;

  @IsOptional()
  @IsString()
  type?: string; // DAILY, STREAK, ONE_TIME
}
