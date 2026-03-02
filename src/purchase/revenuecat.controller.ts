import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('webhooks/revenuecat')
export class RevenueCatController {
  private readonly logger = new Logger(RevenueCatController.name);

  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Webhook received successfully')
  async handleWebhook(@Body() body: Record<string, any>) {
    const event = body.event as Record<string, any> | undefined;

    if (!event) {
      this.logger.warn('Received empty or invalid webhook body');
      return { received: false };
    }

    const eventType = event.type as string;
    const userId = event.app_user_id as string;

    this.logger.log(
      `Processing RevenueCat Event: ${eventType} for User: ${userId}`,
    );

    if (eventType === 'INITIAL_PURCHASE' || eventType === 'RENEWAL') {
      await this.purchaseService.handleRevenueCatPurchase(event);
    } else if (eventType === 'EXPIRATION' || eventType === 'CANCELLATION') {
      await this.purchaseService.handleExpiration(userId);
    }

    return { received: true };
  }
}
