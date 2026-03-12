// src/service/dto/update-service.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsDecimal,
} from "class-validator";

export enum ServiceType {
  SERVICE = "service",
  EVENT = "event",
  CLASS = "class",
}

/**
 * UpdateServiceDto
 * Allows partial updates to service fields.
 */
export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDecimal()
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsEnum(ServiceType)
  @IsOptional()
  type?: ServiceType;
}
