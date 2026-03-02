import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePushTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  platform?: string; // iOS, Android, or Web
}
