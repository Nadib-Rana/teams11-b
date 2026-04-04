import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import {
  NotificationChannel,
  NotificationDeliveryStatus,
} from "../generated/prisma/enums";
import * as admin from "firebase-admin";

@Injectable()
export class NotificationPushService {
  private readonly logger = new Logger(NotificationPushService.name);

  constructor(private prisma: PrismaService) {
    // Initialize Firebase Admin SDK if not already initialized
    if (!admin.apps.length) {
      // Firebase credentials should be configured via environment variables or service account
      // For now, we'll assume it's configured elsewhere or use default credentials
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
        this.logger.log("Firebase Admin SDK initialized successfully");
      } catch (error) {
        this.logger.error("Failed to initialize Firebase Admin SDK:", error);
      }
    }
  }

  async sendPush(
    userId: string,
    title: string,
    message: string,
    type: string = "push",
    deepLink?: string,
    data?: Record<string, string>,
  ) {
    const settings = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });

    if (!settings?.pushNotification) {
      this.logger.log(`Push notifications disabled for user ${userId}`);
      return null;
    }

    try {
      // Get user's FCM tokens from database (you'll need to add this to your user/device model)
      const userDevices = await this.prisma.userDevice.findMany({
        where: { userId, fcmToken: { not: null } },
        select: { fcmToken: true, deviceId: true },
      });

      if (!userDevices || userDevices.length === 0) {
        this.logger.warn(`No FCM tokens found for user ${userId}`);
        // Still create the notification record for in-app display
        return this.createNotificationRecord(
          userId,
          title,
          message,
          type,
          deepLink,
        );
      }

      // Prepare FCM message
      const fcmMessage = {
        notification: {
          title,
          body: message,
        },
        data: {
          type,
          userId,
          deepLink: deepLink || "",
          ...data,
        },
        android: {
          priority: "high" as const,
          notification: {
            clickAction: deepLink || "FLUTTER_NOTIFICATION_CLICK",
            channelId: "default_channel",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      // Send to all user's devices
      const sendPromises = userDevices.map(async (device) => {
        try {
          const result = await admin.messaging().send({
            ...fcmMessage,
            token: device.fcmToken!,
          });

          this.logger.log(
            `Push notification sent to device ${device.deviceId}: ${result}`,
          );
          return {
            deviceId: device.deviceId,
            success: true,
            messageId: result,
          };
        } catch (error) {
          this.logger.error(
            `Failed to send push to device ${device.deviceId}:`,
            error,
          );
          return { deviceId: device.deviceId, success: false, error };
        }
      });

      const results = await Promise.all(sendPromises);
      const successfulSends = results.filter((r) => r.success).length;

      this.logger.log(
        `Push notification sent to ${successfulSends}/${userDevices.length} devices for user ${userId}`,
      );

      // Create notification record regardless of FCM success (for in-app display)
      return this.createNotificationRecord(
        userId,
        title,
        message,
        type,
        deepLink,
      );
    } catch (error) {
      this.logger.error(
        `Error sending push notification to user ${userId}:`,
        error,
      );
      // Still create the notification record for in-app display
      return this.createNotificationRecord(
        userId,
        title,
        message,
        type,
        deepLink,
      );
    }
  }

  async sendBookingPush(
    bookingId: string,
    title: string,
    message: string,
    deepLink?: string,
    data?: Record<string, string>,
  ) {
    // Get booking details to determine the user
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: { include: { user: true } } },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const userId = booking.customer.userId;

    // Default deep link for booking notifications
    const bookingDeepLink = deepLink || `teams11://booking/${bookingId}`;

    // Add booking-specific data
    const bookingData = {
      bookingId,
      serviceId: booking.serviceId,
      businessId: booking.businessId,
      date: booking.date.toISOString(),
      startTime: booking.startTime.toISOString(),
      ...data,
    };

    return this.sendPush(
      userId,
      title,
      message,
      "booking",
      bookingDeepLink,
      bookingData,
    );
  }

  private async createNotificationRecord(
    userId: string,
    title: string,
    message: string,
    type: string,
    deepLink?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        channel: NotificationChannel.push,
        deliveryStatus: NotificationDeliveryStatus.sent,
        // You might want to store deep link in the notification record
        // Add this field to your Notification model if needed
      },
    });
  }
}
