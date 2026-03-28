import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { UpdateVendorDto } from "./dto/update-vendor.dto";

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  private async findVendorByUserId(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException("Vendor profile not found");
    }

    return vendor;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendor: {
          include: {
            businesses: {
              include: {
                images: true,
                category: true,
                staff: true,
                services: true,
              },
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

  async updateProfile(userId: string, dto: UpdateVendorDto) {
    await this.findVendorByUserId(userId); // enforce vendor exists

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        profileImage: dto.profileImage,
      },
      include: {
        vendor: true,
        notificationSettings: true,
      },
    });
  }
}
