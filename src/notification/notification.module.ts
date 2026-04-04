import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { NotificationSchedulerService } from "./notification-scheduler.service";

@Module({
  imports: [ScheduleModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSchedulerService],
  exports: [NotificationService],
})
export class NotificationModule {}
