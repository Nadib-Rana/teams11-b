import { Module, forwardRef } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaService } from '../prisma.service';
import { PushTokenModule } from '../push-token/push-token.module';

@Module({
  imports: [forwardRef(() => PushTokenModule)],
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService],
  exports: [InventoryService],
})
export class InventoryModule {}
