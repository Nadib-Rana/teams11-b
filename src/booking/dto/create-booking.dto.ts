// src/booking/dto/create-booking.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsDateString,
  IsEmpty,
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

  @IsUUID()
  staffId?: string;

  @IsEnum(BookingType)
  @IsNotEmpty()
  bookingType: BookingType;

  @IsDateString()
  @IsNotEmpty()
  date: string; // ISO date format

  // @IsTimeString()
  @IsString()
  @IsNotEmpty()
  startTime: string; // HH:MM:SS format

  @IsEmpty()
  endTime: string; // HH:MM:SS format
}
