import { Controller, Get, Post, Param, ParseUUIDPipe } from '@nestjs/common';
import { StreakService } from './streak.service';

@Controller('streak')
export class StreakController {
  constructor(private readonly streakService: StreakService) {}

  /**
   * ইউজারের বর্তমান স্ট্রিক স্ট্যাটাস দেখার জন্য
   */
  @Get('status/:userId')
  async getStatus(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.streakService.getStreakData(userId);
  }

  /**
   * অটোমেটিক ট্রিগার করার এন্ডপয়েন্ট (বডি ছাড়া)
   */
  @Post('check-in/:userId')
  async checkIn(@Param('userId', ParseUUIDPipe) userId: string) {
    await this.streakService.handleDailyLogin(userId);
    return { success: true, message: 'Daily streak updated' };
  }
}
