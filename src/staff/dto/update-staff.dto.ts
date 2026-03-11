// src/staff/dto/update-staff.dto.ts
import { IsString, IsOptional } from "class-validator";

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  specialties?: string;

  @IsString()
  @IsOptional()
  workingDays?: string;
}
