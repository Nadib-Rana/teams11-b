import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { UpdateVendorDto } from "./dto/update-vendor.dto";

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  private generateReferralCode(): string {
    return `T11-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  private async generateUniqueReferralCode() {
    let referralCode = this.generateReferralCode();
    while (
      (await this.prisma.vendor.findFirst({ where: { referralCode } })) ||
      (await this.prisma.customer.findFirst({ where: { referralCode } }))
    ) {
      referralCode = this.generateReferralCode();
    }
    return referralCode;
  }

  private async findVendorByUserId(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException("Vendor profile not found");
    }

    return vendor;
  }

  private async ensureVendorReferralCode(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) {
      throw new NotFoundException("Vendor profile not found");
    }

    if (vendor.referralCode) {
      return vendor;
    }

    const referralCode = await this.generateUniqueReferralCode();
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { referralCode },
    });
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

    if (user.vendor && !user.vendor.referralCode) {
      const ensuredVendor = await this.ensureVendorReferralCode(user.vendor.id);
      user.vendor = {
        ...user.vendor,
        ...ensuredVendor,
      };
    }

    return user;
  }

  async getReferralSummary(userId: string) {
    const vendor = await this.findVendorByUserId(userId);
    const ensuredVendor = await this.ensureVendorReferralCode(vendor.id);

    const referrals = await this.prisma.referral.findMany({
      where: { referrerUserId: userId },
      include: {
        referredVendor: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      referralCode: ensuredVendor.referralCode,
      referralCount: ensuredVendor.referralCount,
      bonusBalance: ensuredVendor.bonusBalance,
      referrals,
    };
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
