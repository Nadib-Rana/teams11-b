import { Module, forwardRef } from '@nestjs/common';
import { MissionService } from './mission.service';
import { MissionController } from './mission.controller';
import { PushTokenModule } from '../push-token/push-token.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    forwardRef(() => PushTokenModule),
    forwardRef(() => InventoryModule),
  ],
  controllers: [MissionController],
  providers: [MissionService],
  exports: [MissionService],
})
export class MissionModule {}
