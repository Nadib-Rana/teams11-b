import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { NotificationService } from "./notification.service";
import { PrismaService } from "../common/context/prisma.service";

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private notificationService: NotificationService,
    private prisma: PrismaService,
  ) {}

  // Run every 5 minutes to check for pending notifications to send
  @Cron("*/5 * * * *")
  async processPendingNotifications() {
    this.logger.log("Processing pending notifications...");

    const pendingNotifications = await this.prisma.notification.findMany({
      where: {
        deliveryStatus: "pending",
        retryCount: { lt: 3 }, // Max 3 retries
      },
      take: 50, // Process in batches
    });

    for (const notification of pendingNotifications) {
      try {
        await this.notificationService.sendNotificationWithRetry(
          notification.id,
        );
        this.logger.log(`Sent notification ${notification.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to send notification ${notification.id}:`,
          error,
        );
      }
    }
  }

  // Run every hour to schedule appointment reminders
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleAppointmentReminders() {
    this.logger.log("Scheduling appointment reminders...");

    // Find bookings that need reminders (24h and 1h before)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingBookings = await this.prisma.booking.findMany({
      where: {
        status: "confirmed",
        date: {
          gte: now,
          lte: tomorrow,
        },
      },
      include: {
        customer: { include: { user: true } },
        staff: { include: { user: true } },
        notifications: true,
      },
    });

    for (const booking of upcomingBookings) {
      const bookingDateTime = new Date(
        `${booking.date.toISOString().split("T")[0]}T${booking.startTime.toTimeString().split(" ")[0]}`,
      );

      // Check if 24h reminder is needed
      const reminder24hTime = new Date(
        bookingDateTime.getTime() - 24 * 60 * 60 * 1000,
      );
      const has24hReminder = booking.notifications.some(
        (n) => n.bookingId === booking.id && n.title?.includes("24 Hours"),
      );

      if (
        reminder24hTime <= now &&
        reminder24hTime >= new Date(now.getTime() - 60 * 60 * 1000) &&
        !has24hReminder
      ) {
        try {
          await this.notificationService.scheduleAppointmentReminders(
            booking.id,
          );
          this.logger.log(`Scheduled reminders for booking ${booking.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to schedule reminders for booking ${booking.id}:`,
            error,
          );
        }
      }

      // Check if 1h reminder is needed
      const reminder1hTime = new Date(
        bookingDateTime.getTime() - 60 * 60 * 1000,
      );
      const has1hReminder = booking.notifications.some(
        (n) => n.bookingId === booking.id && n.title?.includes("1 Hour"),
      );

      if (
        reminder1hTime <= now &&
        reminder1hTime >= new Date(now.getTime() - 5 * 60 * 1000) &&
        !has1hReminder
      ) {
        try {
          await this.notificationService.scheduleAppointmentReminders(
            booking.id,
          );
          this.logger.log(`Scheduled 1h reminders for booking ${booking.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to schedule 1h reminders for booking ${booking.id}:`,
            error,
          );
        }
      }
    }
  }

  // Run daily at 9 AM to send daily appointment summaries to staff
  @Cron("0 9 * * *")
  async sendDailyAppointmentSummaries() {
    this.logger.log("Sending daily appointment summaries...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const staffMembers = await this.prisma.staff.findMany({
      include: {
        user: true,
        bookings: {
          where: {
            date: {
              gte: today,
              lt: tomorrow,
            },
            status: "confirmed",
          },
          include: {
            customer: { include: { user: true } },
            service: true,
          },
        },
      },
    });

    for (const staff of staffMembers) {
      if (staff.bookings.length > 0) {
        const appointmentsList = staff.bookings
          .map(
            (booking) =>
              `- ${booking.startTime.toTimeString().split(" ")[0]}: ${booking.customer.user.fullName || "Customer"} - ${booking.service.title}`,
          )
          .join("\n");

        try {
          await this.notificationService.createNotificationWithDelivery(
            staff.userId,
            null,
            "email",
            "daily-appointment-summary",
            {
              staffName: staff.user.fullName || "Staff Member",
              date: today.toISOString().split("T")[0],
              appointmentsCount: staff.bookings.length,
              appointmentsList,
            },
          );
          this.logger.log(`Sent daily summary to staff ${staff.userId}`);
        } catch (error) {
          this.logger.error(
            `Failed to send daily summary to staff ${staff.userId}:`,
            error,
          );
        }
      }
    }
  }
}
