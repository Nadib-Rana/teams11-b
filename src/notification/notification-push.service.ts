import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import {
  NotificationChannel,
  NotificationDeliveryStatus,
} from "../generated/prisma/enums";

@Injectable()
export class NotificationPushService {
  private readonly logger = new Logger(NotificationPushService.name);

  constructor(private prisma: PrismaService) {}

  async sendPush(
    userId: string,
    title: string,
    message: string,
    type: string = "push",
  ) {
    const settings = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });

    if (!settings?.pushNotification) {
      this.logger.log(`Push notifications disabled for user ${userId}`);
      return null;
    }

    // TODO: Implement actual push notification service (e.g., Firebase, OneSignal)
    // For now, we store push-style notifications in the database for in-app display
    this.logger.log(
      `Push notification would be sent to user ${userId}: ${title} - ${message}`,
    );

    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        channel: NotificationChannel.push,
        deliveryStatus: NotificationDeliveryStatus.sent,
      },
    });
  }

  async sendBookingPush(
    bookingId: string,
    title: string,
    message: string,
    type: string = "booking",
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { include: { user: true } },
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const userId = booking.customer.user.id;
    return this.sendPush(userId, title, message, type);
  }
}
