import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { Purchase } from '../generated/prisma/client';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @ResponseMessage('Create sucessfully purchase')
  async create(
    @Headers('user-id') userId: string,
    @Body() createPurchaseDto: CreatePurchaseDto,
  ): Promise<Purchase> {
    if (!userId) {
      throw new UnauthorizedException('User ID required in headers');
    }
    return this.purchaseService.create(userId, createPurchaseDto);
  }

  @Get('my-history')
  @ResponseMessage('Own history of the  purchase')
  async getHistory(@Headers('user-id') userId: string): Promise<Purchase[]> {
    if (!userId) {
      throw new UnauthorizedException('User ID required in headers');
    }
    return this.purchaseService.findUserPurchases(userId);
  }
}
