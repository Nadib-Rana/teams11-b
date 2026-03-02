import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StreakService } from '../streak/streak.service';
import { PushTokenService } from '../push-token/push-token.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => StreakService))
    private streakService: StreakService,
    @Inject(forwardRef(() => PushTokenService))
    private pushTokenService: PushTokenService,
  ) {}

  async auth(anonymousId: string) {
    // 🔹 anonymousId এখানে আসলে plain device ID
    const encryptedAnonymousId = this.doubleTranspositionEncrypt(
      anonymousId,
      'KEYONE',
      'KEYTWO',
    );

    const user = await this.prisma.user.upsert({
      where: { anonymousId: encryptedAnonymousId },
      update: { lastActiveAt: new Date() },
      create: { anonymousId: encryptedAnonymousId },
    });

    // 🎯 Workflow 1: Engagement (App Open) - Daily Login Mission + Streak
    try {
      await this.streakService.handleDailyLogin(user.id);
    } catch (error) {
      console.error('Error handling daily login:', error);
    }

    return user;
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { subscription: true },
    });
  }

  // ===============================
  //  Double Transposition Cipher
  // ===============================

  private doubleTranspositionEncrypt(
    text: string,
    key1: string,
    key2: string,
  ): string {
    const first = this.singleTransposition(text, key1);
    const second = this.singleTransposition(first, key2);
    return second;
  }

  private singleTransposition(text: string, key: string): string {
    const cleanText = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const columns = key.length;
    const rows = Math.ceil(cleanText.length / columns);

    // Matrix fill
    const matrix: string[][] = [];
    let index = 0;

    for (let r = 0; r < rows; r++) {
      matrix[r] = [];
      for (let c = 0; c < columns; c++) {
        matrix[r][c] = cleanText[index++] || 'X';
      }
    }

    // Column order from key
    const order = key
      .toUpperCase()
      .split('')
      .map((char, index) => ({ char, index }))
      .sort((a, b) => a.char.localeCompare(b.char));

    // Read column-wise
    let result = '';
    for (const { index: colIndex } of order) {
      for (let r = 0; r < rows; r++) {
        result += matrix[r][colIndex];
      }
    }

    return result;
  }
}
