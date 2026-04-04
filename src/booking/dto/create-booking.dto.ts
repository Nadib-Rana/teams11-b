// src/booking/dto/create-booking.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsDateString,
  Matches,
  IsOptional,
} from "class-validator";

export enum BookingType {
  VIRTUAL = "virtual",
  IN_PERSON = "in_person",
}

/**
 * CreateBookingDto
 * Contains all required and optional fields for creating a new booking.
 */

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsOptional()
  @IsUUID()
  staffId?: string; // Optional: staff can be assigned later by vendor

  @IsEnum(BookingType)
  @IsNotEmpty()
  bookingType: BookingType;

  @IsDateString()
  @IsNotEmpty()
  date: string; // ISO date format

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: "startTime must be in HH:MM:SS format",
  })
  startTime: string; // HH:MM:SS format

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: "endTime must be in HH:MM:SS format",
  })
  endTime: string; // HH:MM:SS format
}
