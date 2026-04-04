// src/dashboard/dashboard.module.ts
import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { BusinessModule } from "../business/business.module";
import { BookingModule } from "../booking/booking.module";
import { ServiceModule } from "../service/service.module";
import { ReviewModule } from "../review/review.module";
import { StaffModule } from "../staff/staff.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [
    BusinessModule,
    BookingModule,
    ServiceModule,
    ReviewModule,
    StaffModule,
    NotificationModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
