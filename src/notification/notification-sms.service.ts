import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import {
  NotificationChannel,
  NotificationDeliveryStatus,
} from "../generated/prisma/enums";
import { sendSmsViaTwilio } from "./notification.helpers";

@Injectable()
export class NotificationSmsService {
  private readonly logger = new Logger(NotificationSmsService.name);

  constructor(private prisma: PrismaService) {}

  async sendSms(
    userId: string,
    title: string,
    message: string,
    type: string = "sms",
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user?.phone) {
      throw new Error("User does not have a phone number for SMS delivery.");
    }

    const settings = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });

    if (!settings?.smsNotification) {
      this.logger.log(`SMS notifications disabled for user ${userId}`);
      return null;
    }

    try {
      await sendSmsViaTwilio(user.phone, message);
      this.logger.log(`SMS sent to ${user.phone}`);

      return this.prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          channel: NotificationChannel.sms,
          deliveryStatus: NotificationDeliveryStatus.sent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${user.phone}:`, error);
      throw error;
    }
  }

  async sendBookingSms(
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
    return this.sendSms(userId, title, message, type);
  }
}
