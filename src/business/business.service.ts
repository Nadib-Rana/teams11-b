import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";
import { Prisma } from "src/generated/prisma/client";

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBusinessDto) {
    // ১. ইউজারের সাথে যুক্ত ভেন্ডর প্রোফাইলটি খুঁজে বের করা
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException("Vendor profile not found for this user.");
    }

    // ২. ডেটা অবজেক্ট তৈরি করা (Type-Safe way)
    const data: Prisma.BusinessCreateInput = {
      name: dto.name,
      description: dto.description,
      logo: dto.logo,
      location: dto.location,
      // রিলেশনশিপের ক্ষেত্রে 'connect' ব্যবহার করতে হবে
      vendor: { connect: { id: vendor.id } },
      // ইমেজ থাকলে সেগুলো একই ট্রানজ্যাকশনে তৈরি করা
      images:
        dto.images && dto.images.length > 0
          ? {
              create: dto.images.map((url) => ({ imageUrl: url })),
            }
          : undefined,
    };

    // ৩. ক্যাটাগরি চেক এবং কানেক্ট করা
    if (dto.category) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.category },
      });
      if (!category) {
        throw new NotFoundException("Category not found");
      }

      // এখানে সরাসরি 'categoryId' লেখা যাবে না, 'category' অবজেক্টের ভেতর 'connect' করতে হবে
      data.category = { connect: { id: dto.category } };
    }

    if (dto.workingDays) {
      data.workingDays = dto.workingDays;
    }

    return this.prisma.business.create({
      data,
      include: {
        images: true,
        category: true,
      },
    });
  }

  async findAll(categoryId?: string) {
    // 'any' এর বদলে Prisma-র টাইপ ব্যবহার করা হয়েছে
    const where: Prisma.BusinessWhereInput = categoryId ? { categoryId } : {};

    return this.prisma.business.findMany({
      where,
      include: {
        images: true,
        category: true,
        _count: { select: { services: true, staff: true } },
      },
    });
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
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

  async update(id: string, dto: UpdateBusinessDto) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const data: Prisma.BusinessUpdateInput = {
      name: dto.name,
      description: dto.description,
      logo: dto.logo,
      location: dto.location,
      workingDays: dto.workingDays,
      images:
        dto.images && dto.images.length > 0
          ? {
              deleteMany: {},
              create: dto.images.map((url) => ({ imageUrl: url })),
            }
          : undefined,
    };

    if (dto.category) {
      data.category = { connect: { id: dto.category } };
    }

    return this.prisma.business.update({
      where: { id },
      data,
      include: { images: true, category: true },
    });
  }
}
