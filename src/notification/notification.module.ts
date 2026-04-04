import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { NotificationSchedulerService } from "./notification-scheduler.service";
import { NotificationEmailService } from "./notification-email.service";
import { NotificationSmsService } from "./notification-sms.service";
import { NotificationPushService } from "./notification-push.service";

@Module({
  imports: [ScheduleModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationSchedulerService,
    NotificationEmailService,
    NotificationSmsService,
    NotificationPushService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
