// src/booking/booking.module.ts
import { Module } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { BookingController } from "./booking.controller";

@Module({
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
