import { Controller, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { PushTokenService } from './push-token.service';
import { CreatePushTokenDto } from './dto/create-push-token.dto';

@Controller('push-token')
export class PushTokenController {
  constructor(private readonly pushTokenService: PushTokenService) {}

  @Post(':userId')
  async register(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreatePushTokenDto,
  ) {
    return this.pushTokenService.registerToken(userId, dto);
  }

  // টেস্ট করার জন্য ম্যানুয়ালি নোটিফিকেশন ট্রিগার এন্ডপয়েন্ট
  @Post('test-push/:userId')
  async testPush(@Param('userId', ParseUUIDPipe) userId: string) {
    await this.pushTokenService.sendInstantNotification(
      userId,
      'Test: Someone shared a thought today.',
    );
    return { success: true };
  }
}
