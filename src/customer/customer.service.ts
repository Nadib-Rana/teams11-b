import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { AddFavoriteDto } from "./dto/add-favorite.dto";
import { JoinWaitingListDto } from "./dto/join-waiting-list.dto";

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  private async findCustomerByUserId(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException("Customer profile not found");
    }

    return customer;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: {
          include: {
            favorites: {
              include: { business: true },
            },
            waitingList: {
              include: { service: true },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        notificationSettings: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateCustomerDto) {
    // Only allow updating certain user fields
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        profileImage: dto.profileImage,
      },
      include: {
        customer: true,
        notificationSettings: true,
      },
    });
  }

  async getFavorites(userId: string) {
    const customer = await this.findCustomerByUserId(userId);
    return this.prisma.favorite.findMany({
      where: { customerId: customer.id },
      include: { business: true },
    });
  }

  async addFavorite(userId: string, dto: AddFavoriteDto) {
    const customer = await this.findCustomerByUserId(userId);

    // Prevent duplicates
    const existing = await this.prisma.favorite.findFirst({
      where: {
        customerId: customer.id,
        businessId: dto.businessId,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.favorite.create({
      data: {
        customerId: customer.id,
        businessId: dto.businessId,
      },
      include: { business: true },
    });
  }

  async removeFavorite(userId: string, businessId: string) {
    const customer = await this.findCustomerByUserId(userId);

    const favorite = await this.prisma.favorite.findFirst({
      where: {
        customerId: customer.id,
        businessId,
      },
    });

    if (!favorite) {
      throw new NotFoundException("Favorite not found");
    }

    return this.prisma.favorite.delete({
      where: { id: favorite.id },
    });
  }

  async getWaitingList(userId: string) {
    const customer = await this.findCustomerByUserId(userId);

    return this.prisma.waitingList.findMany({
      where: { customerId: customer.id },
      include: { service: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async joinWaitingList(userId: string, dto: JoinWaitingListDto) {
    const customer = await this.findCustomerByUserId(userId);

    return this.prisma.waitingList.create({
      data: {
        customerId: customer.id,
        serviceId: dto.serviceId,
        preferredDate: new Date(dto.preferredDate),
      },
      include: { service: true },
    });
  }

  async removeWaitingListEntry(userId: string, entryId: string) {
    const customer = await this.findCustomerByUserId(userId);

    const entry = await this.prisma.waitingList.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.customerId !== customer.id) {
      throw new NotFoundException("Waiting list entry not found");
    }

    return this.prisma.waitingList.delete({ where: { id: entryId } });
  }
}
