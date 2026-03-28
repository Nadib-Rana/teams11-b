// src/booking/booking.module.ts
import { Module } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { BookingController } from "./booking.controller";
import { BookingCreationService } from "./services/booking-creation.service";
import { BookingRetrievalService } from "./services/booking-retrieval.service";
import { BookingUpdateService } from "./services/booking-update.service";
import { BookingAvailabilityService } from "./services/booking-availability.service";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [NotificationModule],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingCreationService,
    BookingRetrievalService,
    BookingUpdateService,
    BookingAvailabilityService,
  ],
  exports: [BookingService],
})
export class BookingModule {}
