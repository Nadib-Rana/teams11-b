import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { CreatePushTokenDto } from './dto/create-push-token.dto';

@Injectable()
export class PushTokenService {
  private readonly logger = new Logger(PushTokenService.name);

  private readonly dailyMessages = [
    'Someone shared a thought today.',
    'Someone might need your perspective.',
    'A question might be waiting for your answer.',
    'A bubble is waiting for you.',
    'Someone is seeking advice on a sensitive topic.',
  ];

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseService,
  ) {}

  /**
   * টোকেন রেজিস্টার করা এবং ইউজারের lastActiveAt আপডেট করা
   */
  async registerToken(userId: string, dto: CreatePushTokenDto) {
    // ১. ইউজারের lastActiveAt আপডেট করা
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });

    // ২. পুশ টোকেন সেভ বা আপডেট করা
    // `deviceToken` isn't unique in the schema, so we can't upsert by it directly.
    // Instead check for an existing row and update/create accordingly.
    const existing = await this.prisma.pushToken.findFirst({
      where: { token: dto.token },
    });

    if (existing) {
      return this.prisma.pushToken.update({
        where: { id: existing.id },
        data: { createdAt: new Date() },
      });
    }

    return this.prisma.pushToken.create({
      data: {
        userId,
        token: dto.token,
        platform: dto.platform,
      },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleEngagementCron() {
    this.logger.log('Checking for inactive users...');

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const usersToNotify = await this.prisma.user.findMany({
      where: {
        lastActiveAt: { lt: twentyFourHoursAgo },
        pushTokens: { some: {} },
      },
      include: { pushTokens: true },
    });

    for (const user of usersToNotify) {
      const message =
        this.dailyMessages[
          Math.floor(Math.random() * this.dailyMessages.length)
        ];
      for (const tokenRecord of user.pushTokens) {
        if (tokenRecord.token) {
          await this.sendToProvider(tokenRecord.token, message);
        }
      }
    }
  }

  /**
   * Firebase এর মাধ্যমে পুশ নোটিফিকেশন পাঠানো
   */
  private async sendToProvider(token: string, body: string): Promise<void> {
    try {
      await this.firebase.sendNotification(token, 'Chaizen Notification', body);
      this.logger.log(`Push sent to ${token}: ${body}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send push to ${token}:`, errorMessage);
      // টোকেন ইনভ্যালিড হলে ডাটাবেস থেকে মুছে ফেলা
      if (
        error instanceof Error &&
        'code' in error &&
        (error as Record<string, any>).code ===
          'messaging/invalid-registration-token'
      ) {
        await this.prisma.pushToken.deleteMany({
          where: { token: token },
        });
        this.logger.log(`Deleted invalid token: ${token}`);
      }
    }
  }

  async sendInstantNotification(userId: string, message: string) {
    const tokens = await this.prisma.pushToken.findMany({ where: { userId } });
    for (const t of tokens) {
      if (t.token) {
        await this.sendToProvider(t.token, message);
      }
    }
  }
}
