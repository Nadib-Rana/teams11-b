import { IsNotEmpty, IsString } from "class-validator";

export class SendBookingReminderDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;
}
