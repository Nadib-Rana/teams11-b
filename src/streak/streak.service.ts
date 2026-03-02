import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MissionService } from '../mission/mission.service';
import { PushTokenService } from '../push-token/push-token.service';

@Injectable()
export class StreakService {
  constructor(
    private prisma: PrismaService,
    private missionService: MissionService,
    @Inject(forwardRef(() => PushTokenService))
    private pushTokenService: PushTokenService,
  ) {}

  /**
   * প্রতিদিনের লগইন এবং স্ট্রিক লজিক হ্যান্ডেল করা
   */
  async handleDailyLogin(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ইউজারের স্ট্রিক রেকর্ড খুঁজে বের করা বা নতুন তৈরি করা
    const userStreak = await this.prisma.userStreak.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        currentStreak: 0,
        lastLoginDate: new Date(0), // অনেক আগের তারিখ যাতে প্রথমবার স্ট্রিক ১ হয়
      },
    });

    const lastLogin = new Date(userStreak.lastLoginDate);
    lastLogin.setHours(0, 0, 0, 0);

    // তারিখের পার্থক্য বের করা
    const diffInDays =
      (today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays === 1) {
      // টানা পরের দিন লগইন করেছে (Streak maintained)
      const updatedStreak = await this.prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: { increment: 1 },
          lastLoginDate: new Date(),
          longestStreak: {
            set: Math.max(
              userStreak.longestStreak,
              userStreak.currentStreak + 1,
            ),
          },
        },
      });
      await this.rewardDailyLogin(userId, updatedStreak.currentStreak);
    } else if (diffInDays > 1) {
      // স্ট্রিক ভেঙে গেছে (Streak reset)
      await this.prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastLoginDate: new Date(),
        },
      });
      await this.rewardDailyLogin(userId, 1);
    }
    // যদি diffInDays === 0 হয়, তার মানে আজ আগেই লগইন করা হয়েছে।
  }

  private async rewardDailyLogin(userId: string, currentStreak: number) {
    // ১. ডেইলি লগইন XP রিওয়ার্ড (+10 XP)
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentXp: { increment: 10 } },
    });

    // ২. স্ট্রিক মাইলস্টোন চেক (৭ দিন ও ১৫ দিন)
    if (currentStreak === 7) {
      await this.missionService.trackProgress(userId, '7_day_streak');
    } else if (currentStreak === 15) {
      await this.missionService.trackProgress(userId, '15_day_streak');
    }
  }

  async getStreakData(userId: string) {
    return this.prisma.userStreak.findUnique({
      where: { userId },
    });
  }
}
