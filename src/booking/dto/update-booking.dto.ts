// src/booking/dto/update-booking.dto.ts
import { IsString, IsOptional, IsEnum, IsDateString } from "class-validator";

export enum BookingStatus {
  PENDING = "pending",
  WAITING = "waiting",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

/**
 * UpdateBookingDto
 * Allows updates to booking status and rescheduling.
 */
export class UpdateBookingDto {
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsDateString()
  @IsOptional()
  date?: string; // for rescheduling

  @IsString()
  @IsOptional()
  startTime?: string; // for rescheduling

  @IsString()
  @IsOptional()
  endTime?: string; // for rescheduling

  @IsString()
  @IsOptional()
  cancelReason?: string; // required when cancelling
}
