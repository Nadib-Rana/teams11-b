import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RegisterDeviceDto {
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @IsNotEmpty()
  @IsString()
  fcmToken: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class UpdateFcmTokenDto {
  @IsNotEmpty()
  @IsString()
  fcmToken: string;
}
