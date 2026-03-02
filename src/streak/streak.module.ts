import { Module, forwardRef } from '@nestjs/common';
import { StreakService } from './streak.service';
import { StreakController } from './streak.controller';
import { MissionModule } from '../mission/mission.module';
import { PrismaService } from '../prisma.service';
import { PushTokenModule } from '../push-token/push-token.module';

@Module({
  imports: [MissionModule, forwardRef(() => PushTokenModule)],
  controllers: [StreakController],
  providers: [StreakService, PrismaService],
  exports: [StreakService],
})
export class StreakModule {}
