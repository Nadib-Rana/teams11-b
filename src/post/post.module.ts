import { Module, forwardRef } from '@nestjs/common';
// import { ScheduleModule } from '@nestjs/schedule';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaModule } from '../prisma.module';
import { MinioModule } from '../minio/minio.module';
import { MissionModule } from '../mission/mission.module';

@Module({
  imports: [PrismaModule, MinioModule, forwardRef(() => MissionModule)],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
