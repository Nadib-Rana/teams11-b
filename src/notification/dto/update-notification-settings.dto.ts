import { IsBoolean, IsOptional } from "class-validator";

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNotification?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotification?: boolean;

  @IsOptional()
  @IsBoolean()
  bookingReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  reminder24h?: boolean;

  @IsOptional()
  @IsBoolean()
  reminder1h?: boolean;
}
