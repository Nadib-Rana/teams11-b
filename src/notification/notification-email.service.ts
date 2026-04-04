import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { MailerService, ISendMailOptions } from "@nestjs-modules/mailer";
import {
  NotificationChannel,
  NotificationDeliveryStatus,
} from "../generated/prisma/enums";

@Injectable()
export class NotificationEmailService {
  private readonly logger = new Logger(NotificationEmailService.name);

  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  async sendEmail(
    userId: string,
    subject: string,
    message: string,
    template?: string,
    context?: Record<string, unknown>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const settings = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });

    if (!settings?.emailNotification) {
      this.logger.log(`Email notifications disabled for user ${userId}`);
      return null;
    }

    const mailOptions: ISendMailOptions = {
      to: user.email,
      subject,
      text: message,
    };

    if (template) {
      mailOptions.template = template;
      if (context) {
        mailOptions.context = context;
      }
    }

    try {
      await this.mailerService.sendMail(mailOptions);
      this.logger.log(`Email sent to ${user.email}`);

      // Store in notification table for in-app/push viewing
      return this.prisma.notification.create({
        data: {
          userId,
          title: subject,
          message,
          type: "email",
          channel: NotificationChannel.email,
          deliveryStatus: NotificationDeliveryStatus.sent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${user.email}:`, error);
      throw error;
    }
  }

  async sendBookingEmail(
    bookingId: string,
    subject: string,
    message: string,
    template?: string,
    context?: Record<string, unknown>,
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
    return this.sendEmail(userId, subject, message, template, context);
  }
}
