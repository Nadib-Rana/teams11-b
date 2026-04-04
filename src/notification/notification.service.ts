import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { UpdateNotificationSettingsDto } from "./dto/update-notification-settings.dto";
import {
  NotificationChannel,
  NotificationDeliveryStatus,
} from "../generated/prisma/enums";
import {
  NotificationTemplateContext,
  NotificationWithUser,
} from "./notification.types";
import { renderNotificationTemplate } from "./notification.helpers";
import { NotificationEmailService } from "./notification-email.service";
import { NotificationSmsService } from "./notification-sms.service";
import { NotificationPushService } from "./notification-push.service";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: NotificationEmailService,
    private smsService: NotificationSmsService,
    private pushService: NotificationPushService,
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
        reminder24h: dto.reminder24h,
        reminder1h: dto.reminder1h,
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
      data: {
        userId,
        title,
        message,
        type,
        channel: NotificationChannel.email,
        deliveryStatus: NotificationDeliveryStatus.sent,
      },
    });
  }

  async sendEmailNotification(
    userId: string,
    subject: string,
    message: string,
    template?: string,
    context?: Record<string, unknown>,
  ) {
    return this.emailService.sendEmail(
      userId,
      subject,
      message,
      template,
      context,
    );
  }

  async sendPushNotification(userId: string, title: string, message: string) {
    return this.pushService.sendPush(userId, title, message);
  }

  async sendSmsNotification(
    userId: string,
    title: string,
    message: string,
    type: string = "sms",
  ) {
    return this.smsService.sendSms(userId, title, message, type);
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
    await this.sendSmsNotification(userId, title, message, "booking");

    // Send push notification with deep link
    const deepLink = `teams11://booking/${bookingId}`;
    return this.pushService.sendPush(
      userId,
      title,
      message,
      "booking",
      deepLink,
      {
        bookingId,
        serviceId: booking.serviceId,
        businessId: booking.businessId,
        date: booking.date.toISOString(),
        startTime: booking.startTime.toISOString(),
      },
    );
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
    const serviceTitle = booking.service.title;
    const bookingDate = booking.date.toISOString().slice(0, 10);
    const startTime = booking.startTime.toTimeString().split(" ")[0];
    const customerName = booking.customer.user.fullName || "Valued Customer";
    const businessName = booking.business.name;
    const staffName = booking.staff?.user?.fullName || "";

    const message = `Your booking for ${serviceTitle} on ${bookingDate} at ${startTime} has been created.`;

    return this.sendBookingNotification(
      bookingId,
      title,
      message,
      "booking-reminder",
      {
        name: customerName,
        serviceTitle,
        businessName,
        date: bookingDate,
        time: startTime,
        staffName,
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
    const serviceTitle = booking.service.title;
    const bookingDate = booking.date.toISOString().slice(0, 10);
    const startTime = booking.startTime.toTimeString().split(" ")[0];
    const customerName = booking.customer.user.fullName || "Valued Customer";
    const businessName = booking.business.name;
    const staffName = booking.staff?.user?.fullName || "";

    const message = `Reminder: You have a booking for ${serviceTitle} on ${bookingDate} at ${startTime}.`;

    return this.sendBookingNotification(
      bookingId,
      title,
      message,
      "booking-reminder",
      {
        name: customerName,
        serviceTitle,
        businessName,
        date: bookingDate,
        time: startTime,
        staffName,
      },
    );
  }

  // New methods for enhanced notification system

  async createNotificationWithDelivery(
    userId: string,
    bookingId: string | null,
    channel: NotificationChannel,
    templateName: string,
    context: NotificationTemplateContext = {},
  ) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { name: templateName },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateName} not found`);
    }

    const { subject, body } = renderNotificationTemplate(
      template.subject || "",
      template.body,
      context,
    );

    return this.prisma.notification.create({
      data: {
        userId,
        bookingId,
        channel,
        deliveryStatus: NotificationDeliveryStatus.pending,
        title: subject,
        message: body,
        type: template.type,
        retryCount: 0,
      },
    });
  }

  async sendNotificationWithRetry(
    notificationId: string,
    maxRetries: number = 3,
  ) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: true },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (notification.deliveryStatus === NotificationDeliveryStatus.sent) {
      return notification;
    }

    try {
      await this.sendViaChannel(notification);
      return await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          deliveryStatus: NotificationDeliveryStatus.sent,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${notificationId}:`,
        error,
      );

      const newRetryCount = notification.retryCount + 1;
      const shouldRetry = newRetryCount < maxRetries;

      return await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          deliveryStatus: shouldRetry
            ? NotificationDeliveryStatus.pending
            : NotificationDeliveryStatus.failed,
          retryCount: newRetryCount,
        },
      });
    }
  }

  private async sendViaChannel(notification: NotificationWithUser) {
    const user = notification.user;

    switch (notification.channel) {
      case NotificationChannel.email: {
        await this.emailService.sendEmail(
          user.id,
          notification.title,
          notification.message,
        );
        break;
      }

      case NotificationChannel.sms: {
        await this.smsService.sendSms(
          user.id,
          notification.title,
          notification.message,
          notification.type,
        );
        break;
      }

      case NotificationChannel.push: {
        await this.pushService.sendPush(
          user.id,
          notification.title,
          notification.message,
        );
        break;
      }

      default: {
        this.logger.warn(
          `Unknown notification channel: ${notification.channel as string}`,
        );
      }
    }
  }

  async getNotificationTemplates() {
    return this.prisma.notificationTemplate.findMany();
  }

  async createNotificationTemplate(data: {
    name: string;
    type: string;
    subject: string;
    body: string;
    variables: string[];
  }) {
    return this.prisma.notificationTemplate.create({
      data,
    });
  }

  async scheduleAppointmentReminders(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { include: { user: true } },
        staff: { include: { user: true } },
        service: true,
        business: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const customerSettings = await this.getSettings(booking.customer.userId);
    const bookingDateTime = new Date(
      `${booking.date.toISOString().split("T")[0]}T${booking.startTime.toTimeString().split(" ")[0]}`,
    );

    // Schedule 24h reminder for customer if enabled
    if (customerSettings.reminder24h !== false) {
      // Default to true if not set
      const reminder24hTime = new Date(
        bookingDateTime.getTime() - 24 * 60 * 60 * 1000,
      );
      if (reminder24hTime > new Date()) {
        await this.createNotificationWithDelivery(
          booking.customer.userId,
          bookingId,
          NotificationChannel.email,
          "appointment-reminder-24h",
          {
            customerName: booking.customer.user.fullName,
            serviceName: booking.service.title,
            businessName: booking.business.name,
            date: booking.date.toISOString().split("T")[0],
            time: booking.startTime.toTimeString().split(" ")[0],
            staffName: booking.staff?.user?.fullName || "",
          },
        );
      }
    }

    // Schedule 1h reminder for customer if enabled
    if (customerSettings.reminder1h !== false) {
      // Default to true if not set
      const reminder1hTime = new Date(
        bookingDateTime.getTime() - 60 * 60 * 1000,
      );
      if (reminder1hTime > new Date()) {
        await this.createNotificationWithDelivery(
          booking.customer.userId,
          bookingId,
          NotificationChannel.email,
          "appointment-reminder-1h",
          {
            customerName: booking.customer.user.fullName,
            serviceName: booking.service.title,
            businessName: booking.business.name,
            date: booking.date.toISOString().split("T")[0],
            time: booking.startTime.toTimeString().split(" ")[0],
            staffName: booking.staff?.user?.fullName || "",
          },
        );
      }
    }

    // Schedule 1h reminder for staff (always enabled for staff)
    const reminder1hTime = new Date(bookingDateTime.getTime() - 60 * 60 * 1000);
    if (reminder1hTime > new Date() && booking.staff) {
      await this.createNotificationWithDelivery(
        booking.staff.userId,
        bookingId,
        NotificationChannel.email,
        "staff-appointment-reminder-1h",
        {
          staffName: booking.staff.user.fullName,
          customerName: booking.customer.user.fullName,
          serviceName: booking.service.title,
          businessName: booking.business.name,
          date: booking.date.toISOString().split("T")[0],
          time: booking.startTime.toTimeString().split(" ")[0],
        },
      );
    }
  }

  async getNotificationAnalytics(userId?: string) {
    const where = userId ? { userId } : {};

    const [total, sent, failed, pending] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { ...where, deliveryStatus: NotificationDeliveryStatus.sent },
      }),
      this.prisma.notification.count({
        where: { ...where, deliveryStatus: NotificationDeliveryStatus.failed },
      }),
      this.prisma.notification.count({
        where: { ...where, deliveryStatus: NotificationDeliveryStatus.pending },
      }),
    ]);

    return {
      total,
      sent,
      failed,
      pending,
      deliveryRate: total > 0 ? (sent / total) * 100 : 0,
    };
  }
}
