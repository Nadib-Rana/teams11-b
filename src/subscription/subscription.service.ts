import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Subscription } from '../generated/prisma/client';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // নতুন সাবস্ক্রিপশন তৈরি করার মেথড
  async create(dto: CreateSubscriptionDto): Promise<Subscription> {
    return this.prisma.subscription.create({
      data: {
        name: dto.name,
        postExpiryHours: dto.postExpiryHours,
        themeColor: dto.themeColor,
        // canHideResponse: dto.canHideResponse,
        price: dto.price,
      },
    });
  }

  // সব সাবস্ক্রিপশন দেখার জন্য
  async findAll(): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      orderBy: {
        price: 'asc',
      },
    });
  }

  // আইডি দিয়ে নির্দিষ্ট সাবস্ক্রিপশন খোঁজার জন্য
  async findOne(id: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { id },
    });
  }
}
