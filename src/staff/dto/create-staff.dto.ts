// src/staff/dto/create-staff.dto.ts
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  IsEmail,
  MinLength,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { WorkingDaysDto } from "./working-days.dto";

export class CreateStaffDto {
  // user information (we may create a new user if one doesn't exist)
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  // staff-specific fields
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

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

  @IsString()
  @IsOptional()
  image?: string; // MinIO object key for staff profile image
}
