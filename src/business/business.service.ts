import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";
import { Prisma } from "src/generated/prisma/client";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

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
      logoKey: dto.logo,
      location: dto.location,
      // রিলেশনশিপের ক্ষেত্রে 'connect' ব্যবহার করতে হবে
      vendor: { connect: { id: vendor.id } },
      // ইমেজ থাকলে সেগুলো একই ট্রানজ্যাকশনে তৈরি করা
      images:
        dto.images && dto.images.length > 0
          ? {
              create: dto.images.map((url) => ({ imageKey: url })),
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

    // প্রতিটি image হলো তা রূপান্তরের আগে টেম্পরারি স্টোরেজ হতে আসতে পারে
    const business = await this.prisma.business.create({
      data,
      include: {
        images: true,
        category: true,
      },
    });

    let finalLogoKey = business.logoKey;

    if (dto.logo && dto.logo.startsWith("businesses/temp/")) {
      const fileName = dto.logo.split("/").pop() ?? `logo-${Date.now()}.jpg`;
      const destinationKey = `businesses/${business.id}/logo-${Date.now()}-${fileName}`;
      finalLogoKey = await this.storageService.moveFile(
        "businesses",
        dto.logo,
        destinationKey,
      );
    }

    if (finalLogoKey !== business.logoKey) {
      await this.prisma.business.update({
        where: { id: business.id },
        data: { logoKey: finalLogoKey },
      });
    }

    if (dto.images && dto.images.length > 0) {
      const finalKeys = [] as string[];

      for (let i = 0; i < dto.images.length; i++) {
        const key = dto.images[i];
        if (key.startsWith("businesses/temp/")) {
          const fileName = key.split("/").pop() ?? `image-${Date.now()}.jpg`;
          const destinationKey = `businesses/${business.id}/images/${Date.now()}-${i}-${fileName}`;
          finalKeys.push(
            await this.storageService.moveFile(
              "businesses",
              key,
              destinationKey,
            ),
          );
        } else {
          finalKeys.push(key);
        }
      }

      // পূর্বেই ডেটাবেসে লোড করা images গুলোলে ডুপ্লিকেট হতে পারে, তাই replace করা ঠিক হবে
      await this.prisma.business.update({
        where: { id: business.id },
        data: {
          images: {
            deleteMany: {},
            create: finalKeys.map((imageKey) => ({ imageKey })),
          },
        },
      });
    }

    return this.prisma.business.findUnique({
      where: { id: business.id },
      include: { images: true, category: true },
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
      logoKey: dto.logo,
      location: dto.location,
      workingDays: dto.workingDays,
      images:
        dto.images && dto.images.length > 0
          ? {
              deleteMany: {},
              create: dto.images.map((url) => ({ imageKey: url })),
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

  /**
   * DELETE BUSINESS WITH CLEANUP
   *
   * এই method:
   * 1. Business থেকে সব associated images খুঁজে বের করে
   * 2. MinIO থেকে প্রতিটি image ফাইল delete করে
   * 3. Database থেকে business এবং images delete করে (cascade)
   *
   * Transaction safety: যদি storage deletion fail হয়, তবুও DB থেকে delete করবে
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    // ১. Business এবং তার সব images খুঁজুন
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const imagesToDelete: Array<{ id: string; url: string; type: string }> = [];

    // २. Logo যোগ করুন
    if (business.logoKey) {
      imagesToDelete.push({
        id: `logo-${business.id}`,
        url: business.logoKey,
        type: "logo",
      });
    }

    // ৩. সব gallery images যোগ করুন
    business.images.forEach((img) => {
      imagesToDelete.push({
        id: img.id,
        url: img.imageKey,
        type: "gallery",
      });
    });

    // ४. Storage থেকে delete করুন
    const deletionResults = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const image of imagesToDelete) {
      try {
        await this.storageService.deleteFile(image.url, "businesses");
        deletionResults.successful++;
        this.logger.debug(`Deleted ${image.type} image: ${image.url}`);
      } catch (error) {
        deletionResults.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        deletionResults.errors.push(
          `Failed to delete ${image.type} (${image.id}): ${errorMsg}`,
        );
        this.logger.warn(
          `Failed to delete image ${image.id} from MinIO: ${errorMsg}`,
        );
        // Continue - don't block DB deletion on storage errors
      }
    }

    // ५. Database থেকে delete করুন (cascade delete handles images)
    try {
      await this.prisma.business.delete({
        where: { id },
      });
      this.logger.debug(`Business ${id} deleted from database`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to delete business ${id} from database: ${errorMsg}`,
      );
      throw new InternalServerErrorException(
        `Failed to delete business: ${errorMsg}`,
      );
    }

    return {
      success: true,
      message: `Business deleted successfully. Storage: ${deletionResults.successful} deleted, ${deletionResults.failed} failed.`,
    };
  }

  /**
   * VERIFY BUSINESS OWNERSHIP
   */
  async verifyOwnership(businessId: string, userId: string): Promise<boolean> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { vendor: { include: { user: true } } },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    if (business.vendor.userId !== userId) {
      throw new ForbiddenException("You can only manage your own businesses");
    }

    return true;
  }
}
