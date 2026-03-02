import { Module, forwardRef } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { PrismaService } from '../prisma.service';
import { MissionModule } from '../mission/mission.module';

@Module({
  imports: [forwardRef(() => MissionModule)],
  controllers: [FavoriteController],
  providers: [FavoriteService, PrismaService],
})
export class FavoriteModule {}
