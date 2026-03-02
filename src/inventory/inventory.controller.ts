import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ইউজারের ইনভেন্টরি চেক করা
  @Get(':userId')
  async getInventory(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.inventoryService.getMyInventory(userId);
  }

  // XP দিয়ে ক্রেডিট কেনা
  @Post('buy-with-xp/:userId')
  async buyItem(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('itemType') itemType: string,
  ) {
    return this.inventoryService.purchaseCreditWithXp(userId, itemType);
  }
}
