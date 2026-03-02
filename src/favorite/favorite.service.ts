import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Favorite } from '../generated/prisma/client';
import { NotificationService } from '../notification/notification.service';
import { MissionService } from '../mission/mission.service';

@Injectable()
export class FavoriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => MissionService))
    private readonly missionService: MissionService,
  ) {}

  async toggleFavorite(
    userId: string,
    dto: CreateFavoriteDto,
  ): Promise<{ favorited: boolean; message: string }> {
    // ১. চেক করুন পোস্টটি ডাটাবেজে আছে কি না
    const post = await this.prisma.post.findUnique({
      where: { id: dto.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // ২. চেক করুন অলরেডি ফেভারিট করা আছে কি না
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_postId: { userId, postId: dto.postId },
      },
    });

    if (existing) {
      // যদি থাকে তবে রিমুভ করুন (Toggle off)
      await this.prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { favorited: false, message: 'Removed from favorites' };
    }

    // ৩. যদি না থাকে তবে অ্যাড করুন (Toggle on)
    const newFavorite = await this.prisma.favorite.create({
      data: {
        userId: userId,
        postId: dto.postId,
      },
    });

    // 🔔 Notification logic added here
    await this.notificationService.create({
      userId: post.userId,
      triggerUserId: userId,
      type: 'NEW_FAVORITE',
      postId: post.id,
      favoriteId: newFavorite.id,
    });

    // 🎯 Workflow 3: Activity (Community Support) - Track for mission (3 favorites = +15 XP)
    try {
      await this.missionService.trackProgress(userId, 'add_3_favorites');
    } catch (error) {
      console.error('Error tracking favorite mission:', error);
    }

    return { favorited: true, message: 'Added to favorites' };
  }

  async getMyFavorites(userId: string): Promise<Favorite[]> {
    // সরাসরি টাইপ-সেফ লিস্ট রিটার্ন
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
