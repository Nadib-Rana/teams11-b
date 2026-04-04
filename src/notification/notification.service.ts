import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { MailerService, ISendMailOptions } from "@nestjs-modules/mailer";
import { UpdateNotificationSettingsDto } from "./dto/update-notification-settings.dto";

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  async getSettings(userId: string) {
    let settings = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.notificationSetting.create({
        data: {
          userId,
          emailNotification: true,
          pushNotification: true,
          bookingReminders: true,
        },
      });
    }

    return settings;
  }

  async updateSettings(userId: string, dto: UpdateNotificationSettingsDto) {
    // Ensure settings exist
    await this.getSettings(userId);

    return this.prisma.notificationSetting.update({
      where: { userId },
      data: {
        emailNotification: dto.emailNotification,
        pushNotification: dto.pushNotification,
        bookingReminders: dto.bookingReminders,
      },
    });
  }

  async listNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException("Notification not found");
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, title, message, type },
    });
  }

  async sendEmailNotification(
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
      throw new NotFoundException("User not found");
    }

    const settings = await this.getSettings(userId);
    if (!settings.emailNotification) {
      // User has opted out of email notifications
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

    await this.mailerService.sendMail(mailOptions);

    // Store in notification table for in-app/push viewing
    return this.createNotification(userId, subject, message, "email");
  }

  async sendPushNotification(userId: string, title: string, message: string) {
    const settings = await this.getSettings(userId);
    if (!settings.pushNotification) {
      return null;
    }

    // For now we persist push-style notifications in DB
    return this.createNotification(userId, title, message, "push");
  }

  async sendBookingNotification(
    bookingId: string,
    title: string,
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
      throw new NotFoundException("Booking not found");
    }

    const userId = booking.customer.user.id;

    await this.sendEmailNotification(userId, title, message, template, context);
    return this.sendPushNotification(userId, title, message);
  }

  async sendBookingCreatedNotification(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { include: { user: true } },
        service: true,
        business: true,
        staff: { include: { user: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const title = "Booking created";
    const message = `Your booking for ${booking.service.title} on ${booking.date
      .toISOString()
      .slice(
        0,
        10,
      )} at ${booking.startTime.toTimeString().split(" ")[0]} has been created.`;

    return this.sendBookingNotification(
      bookingId,
      title,
      message,
      "booking-reminder",
      {
        name: booking.customer.user.fullName,
        serviceTitle: booking.service.title,
        businessName: booking.business.name,
        date: booking.date.toISOString().slice(0, 10),
        time: booking.startTime.toTimeString().split(" ")[0],
        staffName: booking.staff?.user?.fullName ?? "",
      },
    );
  }

  async sendBookingReminder(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { include: { user: true } },
        service: true,
        business: true,
        staff: { include: { user: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const title = "Booking reminder";
    const message = `Reminder: You have a booking for ${booking.service.title} on ${booking.date
      .toISOString()
      .slice(0, 10)} at ${booking.startTime.toTimeString().split(" ")[0]}.`;

    return this.sendBookingNotification(
      bookingId,
      title,
      message,
      "booking-reminder",
      {
        name: booking.customer.user.fullName,
        serviceTitle: booking.service.title,
        businessName: booking.business.name,
        date: booking.date.toISOString().slice(0, 10),
        time: booking.startTime.toTimeString().split(" ")[0],
        staffName: booking.staff?.user?.fullName ?? "",
      },
    );
  }
}
