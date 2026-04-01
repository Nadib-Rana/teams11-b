# File Management - Integration Guide

## 🔗 How to Integrate into Your Modules

This guide shows how to use the File Management system in your existing modules (User, Business, Category, etc).

---

## 1️⃣ User Profile Image Integration

### Update User Entity

```typescript
// src/user/entities/user.entity.ts
export class User {
  id: string;
  email: string;
  profileImage?: string; // Object key from MinIO
  profileImageUrl?: string; // Generated presigned URL (transient)
  // ... other fields
}
```

### Update User Service

```typescript
// src/user/user.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async updateProfileImage(userId: string, objectKey: string) {
    // Delete old image if exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.profileImage) {
      await this.storage.deleteFile(user.profileImage, "profiles");
    }

    // Update with new image
    return this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: objectKey },
    });
  }

  async getUserWithImage(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    // Generate presigned URL on demand
    if (user.profileImage) {
      const imageUrl = await this.storage.getPresignedDownloadUrl(
        user.profileImage,
        "profiles",
        86400, // 24 hours
      );
      return { ...user, profileImageUrl: imageUrl };
    }

    return user;
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Clean up image
    if (user?.profileImage) {
      try {
        await this.storage.deleteFile(user.profileImage, "profiles");
      } catch (error) {
        console.warn("Failed to delete profile image:", error);
      }
    }

    return this.prisma.user.delete({ where: { id: userId } });
  }
}
```

### Update User Controller

```typescript
// src/user/user.controller.ts
import {
  Controller,
  Get,
  Patch,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "./entities/user.entity";
import { UserService } from "./user.service";
import { FILE_SIZE_LIMITS, ALLOWED_MIME_TYPES } from "../storage/constants";

@Controller("api/user")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("profile")
  async getProfile(@CurrentUser() user: User) {
    return this.userService.getUserWithImage(user.id);
  }

  @Patch("profile-image")
  @UseInterceptors(
    FileInterceptor("profileImage", {
      fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(new BadRequestException("Only image files are allowed"), false);
          return;
        }
        if (file.size > FILE_SIZE_LIMITS.profileImage) {
          cb(new BadRequestException("File too large"), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async updateProfileImage(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // File is stored by file-upload.controller
    // Just return success
    return { success: true, message: "Profile updated" };
  }
}
```

---

## 2️⃣ Business Logo & Gallery Integration

### Update Business Entity

```typescript
// src/business/entities/business.entity.ts
export class Business {
  id: string;
  name: string;
  description: string;
  logo?: string; // Object key from MinIO
  logoUrl?: string; // Generated presigned URL (transient)
  gallery?: BusinessImage[]; // Array of gallery images
  // ... other fields
}

export class BusinessImage {
  id: string;
  businessId: string;
  objectKey: string; // Object key from MinIO
  imageUrl?: string; // Generated presigned URL (transient)
  uploadedAt: Date;
  displayOrder: number;
}
```

### Update Business Schema (Prisma)

```prisma
// prisma/schema.prisma
model Business {
  id              String    @id @default(cuid())
  // ... existing fields
  logo            String?   // objectKey
  images          BusinessImage[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model BusinessImage {
  id              String    @id @default(cuid())
  businessId      String
  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  objectKey       String    // objectKey from MinIO
  displayOrder    Int       @default(0)
  createdAt       DateTime  @default(now())

  @@unique([businessId, objectKey])
}
```

### Update Business Service

```typescript
// src/business/business.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class BusinessService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async updateLogo(businessId: string, objectKey: string) {
    // Delete old logo if exists
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (business?.logo) {
      await this.storage.deleteFile(business.logo, "businesses");
    }

    // Update with new logo
    return this.prisma.business.update({
      where: { id: businessId },
      data: { logo: objectKey },
    });
  }

  async addGalleryImage(businessId: string, objectKey: string) {
    const maxOrder = await this.prisma.businessImage.findFirst({
      where: { businessId },
      orderBy: { displayOrder: "desc" },
    });

    return this.prisma.businessImage.create({
      data: {
        businessId,
        objectKey,
        displayOrder: (maxOrder?.displayOrder ?? -1) + 1,
      },
    });
  }

  async getBusinessWithMedia(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        images: { orderBy: { displayOrder: "asc" } },
      },
    });

    if (!business) return null;

    // Generate presigned URLs
    const logoUrl = business.logo
      ? await this.storage.getPresignedDownloadUrl(business.logo, "businesses")
      : null;

    const images = await Promise.all(
      business.images.map(async (img) => ({
        ...img,
        imageUrl: await this.storage.getPresignedDownloadUrl(
          img.objectKey,
          "businesses",
        ),
      })),
    );

    return {
      ...business,
      logoUrl,
      images,
    };
  }

  async deleteGalleryImage(imageId: string) {
    const image = await this.prisma.businessImage.findUnique({
      where: { id: imageId },
    });

    if (image) {
      await this.storage.deleteFile(image.objectKey, "businesses");
    }

    return this.prisma.businessImage.delete({ where: { id: imageId } });
  }

  async deleteBusiness(businessId: string) {
    // Get all images
    const images = await this.prisma.businessImage.findMany({
      where: { businessId },
    });

    // Delete from MinIO
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (business?.logo) {
      try {
        await this.storage.deleteFile(business.logo, "businesses");
      } catch (error) {
        console.warn("Failed to delete logo:", error);
      }
    }

    for (const image of images) {
      try {
        await this.storage.deleteFile(image.objectKey, "businesses");
      } catch (error) {
        console.warn(`Failed to delete image ${image.id}:`, error);
      }
    }

    // Delete from database (cascade will handle images)
    return this.prisma.business.delete({ where: { id: businessId } });
  }

  async reorderGalleryImages(businessId: string, imageIds: string[]) {
    const updates = imageIds.map((imageId, index) =>
      this.prisma.businessImage.update({
        where: { id: imageId },
        data: { displayOrder: index },
      }),
    );

    return Promise.all(updates);
  }
}
```

---

## 3️⃣ Category Image Integration

### Update Category Service

```typescript
// src/category/category.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class CategoryService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async uploadCategoryImage(categoryId: string, objectKey: string) {
    // Delete old image
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (category?.imageUrl) {
      // Extract objectKey from URL if needed
      await this.storage.deleteFile(category.imageUrl, "categories");
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: { imageUrl: objectKey }, // Store objectKey, not URL
    });
  }

  async getCategoryWithImage(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) return null;

    if (category.imageUrl) {
      const presignedUrl = await this.storage.getPresignedDownloadUrl(
        category.imageUrl,
        "categories",
      );
      return { ...category, imageUrl: presignedUrl };
    }

    return category;
  }
}
```

---

## 4️⃣ Review Images Integration

### Update Review Service

```typescript
// src/review/review.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async createReviewWithImages(reviewData: any, imageObjectKeys: string[]) {
    const review = await this.prisma.review.create({
      data: {
        ...reviewData,
        images: {
          create: imageObjectKeys.map((objectKey, index) => ({
            objectKey,
            displayOrder: index,
          })),
        },
      },
      include: { images: true },
    });

    // Generate presigned URLs
    const images = await Promise.all(
      review.images.map(async (img) => ({
        ...img,
        imageUrl: await this.storage.getPresignedDownloadUrl(
          img.objectKey,
          "reviews",
        ),
      })),
    );

    return { ...review, images };
  }

  async deleteReviewImage(imageId: string) {
    const image = await this.prisma.reviewImage.findUnique({
      where: { id: imageId },
    });

    if (image) {
      await this.storage.deleteFile(image.objectKey, "reviews");
    }

    return this.prisma.reviewImage.delete({ where: { id: imageId } });
  }
}
```

---

## 5️⃣ Creating Batch Upload Controller

### Batch Upload Handler for Multiple Images

```typescript
// src/storage/batch-upload.controller.ts
import {
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { StorageService } from "./storage.service";
import { BusinessService } from "../business/business.service";
import { FILE_SIZE_LIMITS, ALLOWED_MIME_TYPES } from "./constants";

@Controller("api/files")
export class BatchUploadController {
  constructor(
    private storage: StorageService,
    private businessService: BusinessService,
  ) {}

  @Post("business/:businessId/gallery-batch")
  @UseInterceptors(
    FilesInterceptor("images", 10, {
      // Max 10 files
      fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(new BadRequestException("Only image files allowed"), false);
          return;
        }
        if (file.size > FILE_SIZE_LIMITS.businessImages) {
          cb(new BadRequestException("File too large"), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadGalleryBatch(
    @Param("businessId") businessId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided");
    }

    const uploadedImages = [];
    const errors = [];

    for (const file of files) {
      try {
        const objectKey = await this.storage.uploadFile(
          file,
          "businesses",
          `${businessId}/images/${Date.now()}-${file.originalname}`,
        );

        const image = await this.businessService.addGalleryImage(
          businessId,
          objectKey,
        );
        uploadedImages.push({
          id: image.id,
          objectKey: image.objectKey,
          displayOrder: image.displayOrder,
        });
      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: uploadedImages.length > 0,
      total: files.length,
      uploaded: uploadedImages.length,
      failed: errors.length,
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
```

---

## 6️⃣ Best Practices for File Management

### ✅ DO

```typescript
// ✅ Store objectKey, not URL
await prisma.user.update({
  data: { profileImage: 'users/uuid/profile.jpg' }
});

// ✅ Generate URLs on-demand
const url = await storage.getPresignedDownloadUrl(objectKey, 'profiles');
return { ...user, profileImageUrl: url };

// ✅ Delete old files before updating
if (user.profileImage) {
  await storage.deleteFile(user.profileImage, 'profiles');
}
await storage.uploadFile(file, 'profiles', newObjectKey);

// ✅ Use consistent bucket types
const BUCKETS = {
  profiles: 'voices-profiles',
  businesses: 'voices-businesses',
  categories: 'voices-categories',
  reviews: 'voices-reviews'
};

// ✅ Handle cleanup on delete
async deleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.profileImage) {
    await storage.deleteFile(user.profileImage, 'profiles');
  }
  await prisma.user.delete({ where: { id: userId } });
}
```

### ❌ DON'T

```typescript
// ❌ Don't store full URLs
await prisma.user.update({
  data: { profileImage: "http://minio:9010/bucket/users/uuid/profile.jpg" },
});

// ❌ Don't generate URLs and save them
const url = await storage.getPresignedDownloadUrl(objectKey, "profiles");
await prisma.user.update({ data: { profileImageUrl: url } }); // URLs expire!

// ❌ Don't leave orphaned files
const newKey = await storage.uploadFile(file, "profiles", newObjectKey);
await prisma.user.update({ data: { profileImage: newKey } });
// Old file still in MinIO!

// ❌ Don't hardcode bucket names
await storage.uploadFile(file, "wrong-bucket-name", objectKey);

// ❌ Don't leak presigned URLs
res.json({ profileImageUrl: presignedUrl }); // Exposed in DB backups!
```

---

## 7️⃣ Environment Configuration

```bash
# .env
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false

# File upload limits (in bytes)
MAX_FILE_SIZE_PROFILE=5242880    # 5MB
MAX_FILE_SIZE_BUSINESS=10485760  # 10MB
MAX_FILE_SIZE_REVIEW=5242880     # 5MB
```

---

## 📋 Module Setup Example

```typescript
// src/business/business.module.ts
import { Module } from "@nestjs/common";
import { BusinessController } from "./business.controller";
import { BusinessService } from "./business.service";
import { StorageModule } from "../storage/storage.module";
import { PrismaModule } from "../prisma.module";

@Module({
  imports: [StorageModule, PrismaModule], // Add StorageModule
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
```

---

## 📚 Summary of Integration Steps

1. **Add file fields to Prisma schema** (objectKey fields)
2. **Update entity DTOs** with file-related fields
3. **Inject StorageService** into service
4. **Implement file operations** in service:
   - uploadFile() for new files
   - deleteFile() for cleanup
   - getPresignedUrl() for retrieval
5. **Add endpoints** in controller for file operations
6. **Import StorageModule** in feature modules
7. **Test all endpoints** with API_TESTING_GUIDE.md

All files are ready! See earlier documentation for complete API details.
