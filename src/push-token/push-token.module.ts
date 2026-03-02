import { Module } from '@nestjs/common';
import { PushTokenService } from './push-token.service';
import { PushTokenController } from './push-token.controller';
import { PrismaService } from '../prisma.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [PushTokenController],
  providers: [PushTokenService, PrismaService],
  exports: [PushTokenService],
})
export class PushTokenModule {}
