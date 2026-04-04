// src/staff/dto/update-staff.dto.ts
import {
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { WorkingDaysDto } from "./working-days.dto";

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  specialties?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WorkingDaysDto)
  workingDays?: WorkingDaysDto;
}
