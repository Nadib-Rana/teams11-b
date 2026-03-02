import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Purchase, Prisma } from '../generated/prisma/client';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(private prisma: PrismaService) {}

  async handleRevenueCatPurchase(event: Record<string, any>) {
    const userId = event.app_user_id as string;
    const productId = event.product_id as string;
    const originalTransactionId = event.original_transaction_id as string;

    const subscription = await this.prisma.subscription.findFirst({
      where: { name: productId },
    });

    if (!subscription) {
      this.logger.error(
        `Subscription plan '${productId}' not found in database.`,
      );
      return;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const purchase = await tx.purchase.upsert({
          where: {
            transactionId: originalTransactionId,
          } as Prisma.PurchaseWhereUniqueInput,
          update: {
            status: 'active',
            expiryDate: event.expiration_at_ms
              ? new Date(event.expiration_at_ms as number)
              : null,
          },
          create: {
            userId: userId,
            subscriptionId: subscription.id,
            platform: event.store as string,
            transactionId: originalTransactionId,
            purchaseDate: new Date(event.purchased_at_ms as number),
            expiryDate: event.expiration_at_ms
              ? new Date(event.expiration_at_ms as number)
              : null,
            status: 'active',
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { subscriptionId: subscription.id },
        });

        this.logger.log(
          `User ${userId} successfully subscribed to ${productId}`,
        );
        return purchase;
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to process RevenueCat purchase: ${errorMessage}`,
      );
    }
  }

  async handleExpiration(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { subscriptionId: null },
      });
      this.logger.log(`Subscription expired for User: ${userId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to handle expiration for User ${userId}: ${errorMessage}`,
      );
    }
  }

  async findUserPurchases(userId: string): Promise<Purchase[]> {
    return this.prisma.purchase.findMany({
      where: { userId },
      orderBy: { purchaseDate: 'desc' },
      include: { subscription: true },
    });
  }

  async create(userId: string, dto: CreatePurchaseDto): Promise<Purchase> {
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          userId: userId,
          subscriptionId: dto.subscriptionId,
          platform: dto.platform,
          transactionId: dto.transactionId,
          purchaseDate: new Date(),
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          status: dto.status,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { subscriptionId: dto.subscriptionId },
      });

      return purchase;
    });
  }
}
