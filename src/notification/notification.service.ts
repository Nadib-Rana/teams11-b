import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
// Browser Notification API এর সাথে কনফ্লিক্ট এড়াতে টাইপ এলিয়াস ব্যবহার
import {
  Notification as PrismaNotification,
  Prisma,
} from '../generated/prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto): Promise<PrismaNotification | null> {
    // No notification for own post/action
    if (dto.userId === dto.triggerUserId) return null;

    return await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        triggerUserId: dto.triggerUserId,
        type: dto.type,
        postId: dto.postId,
        responseId: dto.responseId,
        parentResponseId: dto.parentResponseId,
        favoriteId: dto.favoriteId,
      },
    });
  }

  async findAll(userId: string): Promise<PrismaNotification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      include: {
        triggerUser: { select: { anonymousId: true } },
        post: { select: { contentType: true, textContent: true } },
        response: { select: { textContent: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notifications as PrismaNotification[];
  }

  async markAsRead(id: string, userId: string): Promise<PrismaNotification> {
    return await this.prisma.notification.update({
      where: { id, userId }, // ← security: only owner can mark
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<Prisma.BatchPayload> {
    return await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  //              NEW METHODS - DELETION

  //delete single notification
  async deleteOne(id: string, userId: string): Promise<PrismaNotification> {
    // check if it exists + belongs to user first
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException(
        'You do not have permission to delete this notification',
      );
      // or throw new ForbiddenException() depending on your preference
    }

    return await this.prisma.notification.delete({
      where: { id },
    });
  }

  // Delete ALL notifications for the given user

  async deleteAll(userId: string): Promise<Prisma.BatchPayload> {
    return await this.prisma.notification.deleteMany({
      where: { userId },
    });
  }

  /**
   * Delete only read notifications
   */
  // async deleteAllRead(userId: string): Promise<Prisma.BatchPayload> {
  //   return await this.prisma.notification.deleteMany({
  //     where: { userId, isRead: true },
  //   });
  // }

  // Delete only unread notifications

  // async deleteAllUnread(userId: string): Promise<Prisma.BatchPayload> {
  //   return await this.prisma.notification.deleteMany({
  //     where: { userId, isRead: false },
  //   });
  // }
}
