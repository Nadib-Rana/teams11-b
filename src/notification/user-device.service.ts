import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";

@Injectable()
export class UserDeviceService {
  private readonly logger = new Logger(UserDeviceService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Register or update a device for push notifications
   */
  async registerDevice(
    userId: string,
    deviceId: string,
    fcmToken: string,
    deviceType?: string,
    deviceName?: string,
  ) {
    try {
      const device = await this.prisma.userDevice.upsert({
        where: {
          userId_deviceId: {
            userId,
            deviceId,
          },
        },
        update: {
          fcmToken,
          deviceType,
          deviceName,
          isActive: true,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          userId,
          deviceId,
          fcmToken,
          deviceType,
          deviceName,
          isActive: true,
          lastSeenAt: new Date(),
        },
      });

      this.logger.log(`Device registered for user ${userId}: ${deviceId}`);
      return device;
    } catch (error) {
      this.logger.error(`Failed to register device for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a device (when user logs out or uninstalls app)
   */
  async unregisterDevice(userId: string, deviceId: string) {
    try {
      await this.prisma.userDevice.updateMany({
        where: {
          userId,
          deviceId,
        },
        data: {
          isActive: false,
          fcmToken: null, // Clear FCM token
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Device unregistered for user ${userId}: ${deviceId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to unregister device for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update FCM token for a device (when token refreshes)
   */
  async updateFcmToken(userId: string, deviceId: string, fcmToken: string) {
    try {
      const device = await this.prisma.userDevice.updateMany({
        where: {
          userId,
          deviceId,
          isActive: true,
        },
        data: {
          fcmToken,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (device.count === 0) {
        throw new Error(`Device not found: ${deviceId} for user ${userId}`);
      }

      this.logger.log(
        `FCM token updated for user ${userId}, device ${deviceId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to update FCM token for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get all active devices for a user
   */
  async getUserDevices(userId: string) {
    return this.prisma.userDevice.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        deviceId: true,
        deviceType: true,
        deviceName: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Clean up inactive devices (optional maintenance method)
   */
  async cleanupInactiveDevices(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.userDevice.deleteMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(
      `Cleaned up ${result.count} inactive devices older than ${daysOld} days`,
    );
    return result;
  }
}
