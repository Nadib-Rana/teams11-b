import { Module, forwardRef } from '@nestjs/common';
import { ResponseService } from './response.service';
import { ResponseController } from './response.controller';
import { PrismaModule } from '../prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { MissionModule } from '../mission/mission.module';

@Module({
  imports: [PrismaModule, NotificationModule, forwardRef(() => MissionModule)],
  controllers: [ResponseController],
  providers: [ResponseService],
})
export class ResponseModule {}
