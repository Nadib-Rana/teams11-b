import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { RevenueCatController } from './revenuecat.controller';
import { PrismaModule } from 'src/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PurchaseController, RevenueCatController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
