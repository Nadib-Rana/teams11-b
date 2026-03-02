import { IsInt, IsUUID, Min } from 'class-validator';

export class UpdateStreakDto {
  @IsUUID()
  userId: string;

  @IsInt()
  @Min(0)
  currentStreak: number;
}
