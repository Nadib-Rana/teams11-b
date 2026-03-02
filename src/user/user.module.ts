import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { StreakModule } from '../streak/streak.module';
import { PushTokenModule } from '../push-token/push-token.module';

@Module({
  imports: [forwardRef(() => StreakModule), forwardRef(() => PushTokenModule)],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
