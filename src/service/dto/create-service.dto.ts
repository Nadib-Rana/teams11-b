// src/service/dto/create-service.dto.ts
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsUUID,
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
 * CreateServiceDto
 * Contains all required and optional fields for creating a new service.
 */
export class CreateServiceDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDecimal()
  @IsNotEmpty()
  price: number; // decimal price

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  duration: number; // duration in minutes

  @IsString()
  @IsOptional()
  color?: string;

  @IsEnum(ServiceType)
  @IsNotEmpty()
  type: ServiceType;
}
