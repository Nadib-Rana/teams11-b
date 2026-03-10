// src/business/business.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service"; // Adjust path
import { CreateBusinessDto } from "./dto/create-business.dto";

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBusinessDto) {
    // 1. Find the Vendor associated with this User ID
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException("Vendor profile not found for this user.");
    }

    // 2. Create the Business
    return this.prisma.business.create({
      data: {
        name: dto.name,
        description: dto.description,
        logo: dto.logo,
        location: dto.location,
        vendorId: vendor.id,
        // If images are provided, create them in the same transaction
        images:
          dto.images && dto.images.length > 0
            ? {
                create: dto.images.map((url) => ({ imageUrl: url })),
              }
            : undefined,
      },
      include: {
        images: true,
      },
    });
  }

  async findAll() {
    return this.prisma.business.findMany({
      include: {
        images: true,
        _count: { select: { services: true, staff: true } },
      },
    });
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        images: true,
        services: true,
        staff: {
          include: { user: { select: { fullName: true, profileImage: true } } },
        },
      },
    });

    if (!business) throw new NotFoundException("Business not found");
    return business;
  }

  async findByVendor(userId: string) {
    return this.prisma.business.findMany({
      where: { vendor: { userId } },
      include: { images: true },
    });
  }
}
