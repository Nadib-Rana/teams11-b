// src/business/dto/create-business.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsArray } from "class-validator";

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[]; // Array of image URLs for BusinessImage model
}
