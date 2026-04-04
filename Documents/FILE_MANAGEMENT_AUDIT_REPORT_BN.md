# 📋 File Management System - Comprehensive Audit Report

**তৈরি**: April 2, 2026  
**অডিট সংস্করণ**: v1.0  
**স্ট্যাটাস**: ⚠️ গুরুতর সমস্যা চিহ্নিত

---

## 📌 Executive Summary

আপনার বর্তমান ইমপ্লিমেন্টেশনে **৪টি গুরুতর সমস্যা** এবং **২টি ডিজাইন উন্নতির সুযোগ** রয়েছে:

| সমস্যা                | গুরুত্ব     | অবস্থা                    |
| --------------------- | ----------- | ------------------------- |
| Schema Alignment      | ✅ GOOD     | সঠিক আছে                  |
| Object Key vs URL     | ⚠️ MIXED    | আংশিক সঠিক, আংশিক সমস্যা  |
| One-to-Many Cleanup   | ❌ CRITICAL | Orphaned files সম্ভব      |
| Transaction Safety    | ❌ CRITICAL | Orphaned files ঝুঁকি উচ্চ |
| Presigned URL Utility | ⚠️ MISSING  | Global converter প্রয়োজন |

---

## 🔍 1. SCHEMA ALIGNMENT CHECK

### ✅ অবস্থা: GOOD - সঠিক আছে

আপনার স্কিমায় এই ইমেজ ফিল্ডগুলো আছে:

```prisma
// User Model
profileImage     String?   @map("profile_image")

// Business Model
logo             String?
images           BusinessImage[]  // One-to-Many

// BusinessImage Model
imageUrl        String    @map("image_url")

// Category Model
image           String
```

### ✅ কোড ইমপ্লিমেন্টেশন: CORRECT

আপনার কোড সঠিকভাবে আলাদা বকেট ব্যবহার করছে:

```typescript
// StorageService এ বকেট টাইপ
type BucketType =
  | "profiles"
  | "businesses"
  | "categories"
  | "reviews"
  | "documents";

// File-Upload Controller এ স্পষ্ট পাথ
`users/${userId}/profile-${Date.now()}.jpg` // profiles bucket
`businesses/${businessId}/logo-${Date.now()}.jpg` // businesses bucket
`businesses/${businessId}/images/${Date.now()}-...`; // businesses bucket
```

**Result**: ✅ MinIO বকেট সঠিকভাবে সংগঠিত

---

## 🔑 2. OBJECT KEY vs URL - DETAILED ANALYSIS

### ✅ ভালো দিক: Database Storage সঠিক

আপনি ডাটাবেসে **শুধু Object Key সংরক্ষণ** করছেন:

```typescript
// File-Upload Controller
const objectKey = await this.storageService.uploadFile(
  file,
  "profiles",
  `users/${userId}/...`,
);

// Database সংরক্ষণ - শুধু KEY
await this.prisma.user.update({
  where: { id: userId },
  data: { profileImage: objectKey }, // ✅ শুধু key, পূর্ণ URL নয়
});
```

### ⚠️ সমস্যা: Schema Documentation অস্পষ্ট

**সমস্যা**: BusinessImage মডেলে ফিল্ড নাম `imageUrl` কিন্তু সেখানে Object Key সংরক্ষিত হচ্ছে:

```prisma
model BusinessImage {
  id         String   @id
  imageUrl   String   @map("image_url")  // ⚠️ নাম ভুল - key সংরক্ষিত হচ্ছে
}
```

```typescript
// Controller এ
data: {
  businessId,
  imageUrl: objectKey,  // ⚠️ নাম বিভ্রান্তিকর - এটি URL নয়, Key
}
```

### 🔧 সুপারিশ:

```prisma
model BusinessImage {
  id         String   @id
  businessId String   @map("business_id")
  business   Business @relation(...)

  // Option 1: নাম পরিবর্তন করুন
  imageKey   String   @map("image_key")  // ✅ স্পষ্ট

  // অথবা Option 2: Documentation যোগ করুন
  /// Stores object key in MinIO (not full URL)
  imageUrl   String   @map("image_url")
}
```

---

## 🗑️ 3. ONE-TO-MANY CLEANUP - CRITICAL ISSUE

### ❌ সমস্যা: Orphaned Files ঝুঁকি

আপনার বর্তমান কোডে এই সমস্যা আছে:

#### সমস্যা #1: BusinessImage ডিলিট করলে ঠিক আছে

```typescript
@Delete("business-images/:imageId")
async deleteBusinessImage(@Param("imageId") imageId: string) {
  const businessImage = await this.prisma.businessImage.findUnique({
    where: { id: imageId }
  });

  // ✅ MinIO থেকে ফাইল ডিলিট
  await this.storageService.deleteFile(businessImage.imageUrl, "businesses");

  // ✅ Database থেকে ডিলিট
  await this.prisma.businessImage.delete({ where: { id: imageId } });
}
```

#### ⚠️ **সমস্যা #2: পুরো Business ডিলিট করলে Orphaned Files থাকবে!**

**বর্তমান অবস্থা**: Business মডেলে কোনো delete পদ্ধতি নেই

```typescript
// BusinessService - DELETE METHOD MISSING!
// কোনো cleanup logic নেই যখন business ডিলিট হয়
```

**Cascade delete নেই Schema-তে**:

```prisma
model Business {
  // ...
  images     BusinessImage[]  // ⚠️ onDelete: Cascade নেই!
}

model BusinessImage {
  businessId String   @map("business_id")
  business   Business @relation(
    fields: [businessId],
    references: [id]
    // ⚠️ onDelete: Cascade যুক্ত করা উচিত
  )
}
```

### 🔧 সমাধান:

#### Step 1: Schema Update করুন

```prisma
model BusinessImage {
  id         String   @id @default(uuid()) @db.Uuid
  businessId String   @map("business_id") @db.Uuid
  business   Business @relation(
    fields: [businessId],
    references: [id],
    onDelete: Cascade  // ✅ এটি যোগ করুন
  )
  imageUrl   String   @map("image_url")

  @@map("business_images")
}
```

#### Step 2: Migration চালান

```bash
npx prisma migrate dev --name add_cascade_delete_business_images
```

#### Step 3: BusinessService-তে Delete Method যোগ করুন

```typescript
// business.service.ts
async delete(id: string) {
  const business = await this.prisma.business.findUnique({
    where: { id },
    include: { images: true }
  });

  if (!business) {
    throw new NotFoundException("Business not found");
  }

  // Step 1: সব ইমেজ MinIO থেকে ডিলিট করুন
  for (const image of business.images) {
    try {
      await this.storageService.deleteFile(image.imageUrl, "businesses");
    } catch (error) {
      console.error(`Failed to delete image ${image.id}:`, error);
      // Continue - don't block the database deletion
    }
  }

  // Step 2: Business এবং তার ছবিগুলো database থেকে ডিলিট করুন
  // (Cascade delete তাদের স্বয়ংক্রিয় ডিলিট করবে)
  return this.prisma.business.delete({
    where: { id }
  });
}
```

#### Step 4: Controller-তে Delete Endpoint যোগ করুন

```typescript
// business.controller.ts
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('vendor')
@ResponseMessage('Business deleted successfully')
async delete(
  @Param('id', ParseUUIDPipe) id: string,
  @GetUser('userId') userId: string
) {
  // Vendor যাচাই করুন
  const business = await this.businessService.findOne(id);
  const vendor = await this.prisma.vendor.findUnique({
    where: { userId }
  });

  if (business.vendorId !== vendor.id) {
    throw new ForbiddenException('You can only delete your own business');
  }

  return this.businessService.delete(id);
}
```

---

## 🔒 4. TRANSACTION SAFETY - CRITICAL ISSUE

### ❌ সমস্যা: Orphaned Files Risk উচ্চ

আপনার বর্তমান উপায়ে এই সমস্যা আছে:

```typescript
// ⚠️ এই প্যাটার্ন ঝুঁকিপূর্ণ
async uploadProfileImage(file, userId) {
  // Step 1: MinIO upload করুন (সফল হয়েছে)
  const objectKey = await this.storageService.uploadFile(file, "profiles", ...);

  // Step 2: Database update করুন (যদি FAIL হয়?)
  // ❌ যদি এখানে error হয়, orphaned file থাকবে MinIO-তে!
  await this.prisma.user.update({
    where: { id: userId },
    data: { profileImage: objectKey }
  });
}
```

### প্রকৃত Scenario:

```
MinIO Upload Successful ✅
  ↓
Database Update Started... ⏳
  ├─ Network Error ❌
  ├─ Database Timeout ❌
  └─ Constraint Violation ❌

Result:
- MinIO-তে File থাকে (অপ্রয়োজনীয়) ❌
- Database এ Record নেই
- ফাইল কখনো অ্যাক্সেস করা যাবে না
```

### 🔧 সমাধান: Transaction + Cleanup Logic

#### Option 1: DB Transaction ব্যবহার করুন

```typescript
async uploadProfileImage(file: Express.Multer.File, userId: string) {
  if (!file) {
    throw new BadRequestException("No file provided");
  }

  let uploadedObjectKey: string | null = null;
  const oldObjectKey: string | null = null;

  try {
    // Step 1: পুরাতন ছবি খুঁজুন
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (user?.profileImage) {
      oldObjectKey = user.profileImage;
    }

    // Step 2: নতুন ছবি upload করুন MinIO-তে
    uploadedObjectKey = await this.storageService.uploadFile(
      file,
      "profiles",
      `users/${userId}/profile-${Date.now()}.jpg`
    );

    // Step 3: Database update করুন transaction এর মধ্যে
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: uploadedObjectKey }
    });

    // Step 4: পুরাতন ছবি delete করুন (success-এর পর)
    if (oldObjectKey) {
      try {
        await this.storageService.deleteFile(oldObjectKey, "profiles");
      } catch (error) {
        console.warn(`Failed to delete old image ${oldObjectKey}:`, error);
      }
    }

    // Generate presigned URL
    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      uploadedObjectKey,
      "profiles"
    );

    return {
      success: true,
      objectKey: uploadedObjectKey,
      imageUrl,
      message: "Profile image uploaded successfully"
    };

  } catch (error) {
    // ⚠️ যদি database update fail হয়
    if (uploadedObjectKey) {
      // Cleanup: নতুন upload করা ফাইল delete করুন
      try {
        await this.storageService.deleteFile(
          uploadedObjectKey,
          "profiles"
        );
        console.log(`Cleanup: Deleted orphaned file ${uploadedObjectKey}`);
      } catch (cleanupError) {
        console.error(
          `Failed to cleanup file ${uploadedObjectKey}:`,
          cleanupError
        );
        // Log this for manual cleanup later
      }
    }

    throw error;
  }
}
```

#### Option 2: Two-Phase Commit Pattern

```typescript
// storage.service.ts - Transactional upload
async uploadFileWithMetadata(
  file: Express.Multer.File,
  bucketType: BucketType,
  userId: string,
  customObjectName?: string
): Promise<{ objectKey: string; rollback: () => Promise<void> }> {
  const objectKey = customObjectName || `${Date.now()}-${file.originalname}`;

  try {
    await this.uploadFile(file, bucketType, objectKey);

    // Rollback function যদি পরবর্তী step fail হয়
    const rollback = async () => {
      try {
        await this.deleteFile(objectKey, bucketType);
      } catch (error) {
        console.error(`Failed to rollback file ${objectKey}:`, error);
      }
    };

    return { objectKey, rollback };
  } catch (error) {
    throw error;
  }
}
```

#### Option 3: Event-based Cleanup

```typescript
// একটি background job যেখানে orphaned files পরিষ্কার করা হয়
@Injectable()
@Cron("0 2 * * *") // প্রতিদিন 2 AM এ
export class FileCleanupService {
  constructor(
    private storage: StorageService,
    private prisma: PrismaService,
  ) {}

  async cleanupOrphanedFiles() {
    // MinIO-তে সব files খুঁজুন
    // Database-এ check করুন কোনটি reference করা হয়নি
    // Delete unreferenced files
  }
}
```

---

## 🔄 5. PRESIGNED URL UTILITY - DESIGN IMPROVEMENT

### ⚠️ বর্তমান সমস্যা:

API responses-এ যেখানে ইমেজ থাকে, সেখানে client-কে manual conversion করতে হয়:

```typescript
// Current implementation
// User GET response
{
  "data": {
    "id": "user-123",
    "profileImage": "users/user-123/profile-1711938000000.jpg"  // ⚠️ শুধু key
  }
}

// Frontend-এ করতে হয়:
const response = await fetch('/users/me');
const user = await response.json();

// Manual conversion প্রতিবার
const imageUrl = await fetch(
  `/api/files/profile-image/${encodeURIComponent(user.profileImage)}`
).then(r => r.json()).then(d => d.imageUrl);
```

### ❌ সমস্যা:

- Inconsistent: কোথাও URL, কোথাও key
- Client-side complexity
- Error-prone
- Performance inefficient (extra API call needed)

### ✅ সমাধান: Global Image Transform Utility

#### Step 1: Image Transform Interceptor তৈরি করুন

```typescript
// src/common/interceptors/image-transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { StorageService } from "src/storage/storage.service";

@Injectable()
export class ImageTransformInterceptor implements NestInterceptor {
  constructor(private storageService: StorageService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === "object") {
          return this.transformImageKeys(data);
        }
        return data;
      }),
    );
  }

  private transformImageKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformImageKeys(item));
    }

    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    const transformed = { ...obj };

    // Transform user profile images
    if (obj.profileImage && typeof obj.profileImage === "string") {
      transformed.profileImage = this.storageService.getObjectUrl(
        obj.profileImage,
        "profiles",
      );
      transformed.profileImagePresigned = obj.profileImage;
    }

    // Transform business logos
    if (obj.logo && typeof obj.logo === "string" && obj.vendorId) {
      transformed.logo = this.storageService.getObjectUrl(
        obj.logo,
        "businesses",
      );
      transformed.logoKey = obj.logo;
    }

    // Transform business images
    if (obj.images && Array.isArray(obj.images)) {
      transformed.images = obj.images.map((img: any) => ({
        ...img,
        imageUrl: this.storageService.getObjectUrl(img.imageUrl, "businesses"),
        imageKey: img.imageUrl,
      }));
    }

    // Recursively transform nested objects
    Object.keys(transformed).forEach((key) => {
      if (transformed[key] instanceof Object) {
        transformed[key] = this.transformImageKeys(transformed[key]);
      }
    });

    return transformed;
  }
}
```

#### Step 2: AppModule-এ Register করুন

```typescript
// src/app.module.ts
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ImageTransformInterceptor } from "./common/interceptors/image-transform.interceptor";

@Module({
  // ...
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ImageTransformInterceptor,
    },
    // ... other interceptors
  ],
})
export class AppModule {}
```

#### Step 3: Helper Class তৈরি করুন

```typescript
// src/common/utils/image-transform.util.ts
export class ImageTransformUtil {
  static isProfileImage(key: string): boolean {
    return key.startsWith("users/");
  }

  static isBusinessImage(key: string): boolean {
    return key.startsWith("businesses/");
  }

  static isLogoImage(key: string): boolean {
    return key.includes("/logo-");
  }

  static determineBucketType(
    key: string,
  ): "profiles" | "businesses" | "categories" {
    if (this.isProfileImage(key)) return "profiles";
    if (this.isBusinessImage(key)) return "businesses";
    return "categories";
  }
}
```

#### Step 4: Response থেকে URL নির্বাচন করুন

```typescript
// src/common/dto/image-response.dto.ts
export class ImageResponseDto {
  /** Direct URL (সর্বদা accessible - cached) */
  imageUrl?: string;

  /** Presigned URL (temporary, expiring) */
  imagePresignedUrl?: string;

  /** Raw object key (যদি client নিজে presigned generate করতে চায়) */
  imageKey?: string;
}
```

### ✅ Result: একটি সুসংগত API

```typescript
// এখন responses এমন হবে:
{
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "profileImage": "http://minio:9010/devscout-profiles/users/user-123/profile-1711938000000.jpg",  // ✅ Direct URL
    "profileImagePresigned": "users/user-123/profile-1711938000000.jpg",  // Raw key
    "business": {
      "id": "biz-123",
      "name": "My Business",
      "logo": "http://minio:9010/devscout-businesses/businesses/biz-123/logo-1711938000000.jpg",  // ✅ Direct URL
      "images": [
        {
          "id": "img-1",
          "imageUrl": "http://minio:9010/devscout-businesses/businesses/biz-123/images/1711938000000-photo.jpg",  // ✅ Direct URL
          "imageKey": "businesses/biz-123/images/1711938000000-photo.jpg"  // Raw key
        }
      ]
    }
  }
}
```

---

## 📊 AUDIT SUMMARY TABLE

| চেকপয়েন্ট               | স্ট্যাটাস     | উৎকর্ষতা                           | কর্ম প্রয়োজন                            |
| ------------------------ | ------------- | ---------------------------------- | ---------------------------------------- |
| 1. Schema Alignment      | ✅ GOOD       | বকেট সঠিক, কিন্তু naming ambiguous | Schema documentation improve করুন        |
| 2. Object Key Storage    | ✅ GOOD       | KEY store করছেন (URL নয়)          | Field names clarify করুন                 |
| 3. One-to-Many Cleanup   | ❌ CRITICAL   | Orphaned files সম্ভব               | Cascade delete + service method add করুন |
| 4. Transaction Safety    | ❌ CRITICAL   | DB fail → orphaned files           | Try-catch + rollback implement করুন      |
| 5. Presigned URL Utility | ⚠️ INCOMPLETE | Manual conversion প্রয়োজন         | Global interceptor implement করুন        |

---

## 🎯 IMMEDIATE ACTION ITEMS (Priority Order)

### 🔴 CRITICAL (এক সপ্তাহের মধ্যে)

1. **Business Delete Method যোগ করুন** → Orphaned files prevent করুন
2. **Transaction Safety Implement করুন** → Upload failure scenarios handle করুন
3. **Cascade Delete Schema Update করুন** → Migration চালান

### 🟡 HIGH (২ সপ্তাহের মধ্যে)

4. **Image Transform Interceptor** → API responses consistent করুন
5. **Field Naming Document করুন** → Developer confusion remove করুন

### 🟢 MEDIUM (মাসের মধ্যে)

6. **Automated Cleanup Job** → Orphaned files periodic cleanup করুন
7. **Image Versioning Strategy** → Multi-version support add করুন

---

## 📝 Implementation Checklist

- [ ] Delete Business method create করা
- [ ] Cascade delete schema migration run করা
- [ ] Transaction safety pattern implement করা
- [ ] ImageTransformInterceptor register করা
- [ ] Error handling tests add করা
- [ ] Integration tests run করা
- [ ] Documentation update করা
