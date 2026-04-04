// src/business/dto/create-business.dto.ts

import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { WorkingDaysDto } from "../../staff/dto/working-days.dto";

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsOptional()
  category?: string; // UUID of the business category (optional)

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WorkingDaysDto)
  workingDays?: WorkingDaysDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
