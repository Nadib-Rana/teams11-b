import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { PushTokenService } from '../push-token/push-token.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class MissionService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => PushTokenService))
    private pushTokenService: PushTokenService,
    @Inject(forwardRef(() => InventoryService))
    private inventoryService: InventoryService,
  ) {}

  // Create a new misstion
  async create(createMissionDto: CreateMissionDto) {
    return this.prisma.mission.create({
      data: createMissionDto,
    });
  }

  /**
   * Track the progree of the user (Workflow 2, 3)
   */
  async trackProgress(userId: string, missionSlug: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { slug: missionSlug },
    });

    if (!mission) return;

    const progress = await this.prisma.userMissionProgress.upsert({
      where: {
        userId_missionId: { userId, missionId: mission.id },
      },
      update: {
        currentCount: { increment: 1 },
      },
      create: {
        userId,
        missionId: mission.id,
        currentCount: 1,
      },
    });

    // মিশন সম্পন্ন হলে XP রিওয়ার্ড দেওয়া (Workflow 4)
    if (
      !progress.isCompleted &&
      progress.currentCount >= mission.requirementCount
    ) {
      const result = await this.completeMission(
        userId,
        progress.id,
        mission.xpReward,
      );

      // 🔔 Send notification for mission completion
      try {
        await this.pushTokenService.sendInstantNotification(
          userId,
          `🎉 Mission "${mission.title}" completed! You earned +${mission.xpReward} XP.`,
        );
      } catch (error) {
        console.error('Error sending mission completion notification:', error);
      }

      // If level up, send level-up notification
      if (result && result.newLevel > result.oldLevel) {
        try {
          await this.pushTokenService.sendInstantNotification(
            userId,
            `⭐ Level Up! You reached Level ${result.newLevel}. Credits have been added to your inventory!`,
          );
        } catch (error) {
          console.error('Error sending level-up notification:', error);
        }
      }
    }
  }

  private async completeMission(
    userId: string,
    progressId: string,
    xpReward: number,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const updatedProgress = await tx.userMissionProgress.update({
        where: { id: progressId },
        data: { isCompleted: true },
      });

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const newXp = user.currentXp + xpReward;
      const oldLevel = user.level;
      const newLevel = this.calculateLevel(newXp);

      // Update user XP and level
      await tx.user.update({
        where: { id: userId },
        data: {
          currentXp: newXp,
          level: newLevel,
        },
      });

      // If level up, add credits to inventory
      if (newLevel > oldLevel) {
        const levelDifference = newLevel - oldLevel;
        // Add credits (e.g., 100 credits per level up)
        await tx.userInventory.upsert({
          where: { userId_itemType: { userId, itemType: 'LEVEL_UP_CREDIT' } },
          update: { quantity: { increment: 100 * levelDifference } },
          create: {
            userId,
            itemType: 'LEVEL_UP_CREDIT',
            quantity: 100 * levelDifference,
          },
        });
      }

      return { updatedProgress, newLevel, oldLevel };
    });
  }

  private calculateLevel(totalXp: number): number {
    // Simple level calculation: 100 XP per level
    // Level 1 = 0-99 XP, Level 2 = 100-199 XP, etc.
    return Math.floor(totalXp / 100) + 1;
  }

  // ইউজারের সব মিশনের বর্তমান অবস্থা দেখা
  async getMyMissions(userId: string) {
    return this.prisma.userMissionProgress.findMany({
      where: { userId },
      include: { mission: true },
    });
  }
}
