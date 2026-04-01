# Database Migration Guide for MinIO Integration

## Overview

When migrating from local file storage or direct URLs to MinIO file storage, you need to update how files are referenced in the database.

## Schema Changes

### Before (Direct URL Storage)

```prisma
model User {
  profileImage String? // e.g., "https://cdn.example.com/users/123/profile.jpg"
}
```

### After (MinIO Object Key Storage)

```prisma
model User {
  profileImage String? // e.g., "users/123/profile-1711270000000.jpg"
}
```

## Why Store Object Keys Instead of URLs?

1. **Flexibility**: Change MinIO endpoint without updating database
2. **Security**: URLs are generated on-demand with self-expiring access
3. **Consistency**: All files follow the same reference pattern
4. **Simplicity**: Easier to manage file lifecycle (upload, delete, migrate)

## Migration Steps

### Step 1: Add Comments to Schema (No Migration Required)

Your Prisma schema fields that store files should have a comment:

```prisma
model User {
  id            String    @id @default(uuid()) @db.Uuid
  fullName      String?   @map("full_name")
  profileImage  String?   @map("profile_image") // MinIO object key: users/{userId}/profile-*.jpg
}

model Business {
  id            String    @id @default(uuid()) @db.Uuid
  name          String
  logo          String?   // MinIO object key: businesses/{businessId}/logo-*.jpg
}

model BusinessImage {
  id            String   @id @default(uuid()) @db.Uuid
  imageUrl      String   @map("image_url") // MinIO object key: businesses/{businessId}/images/*.jpg
}

model Category {
  id            String @id @default(uuid()) @db.Uuid
  name          String
  image         String // MinIO object key: categories/{categoryId}/*
}
```

### Step 2: No Database Schema Changes Needed

The current schema works perfectly with MinIO object keys since they're just strings. No `CREATE MIGRATION` is needed.

### Step 3: Implementation in Services

Update your existing services to use StorageService:

#### Example: User Service

**Before (if using local files or external CDN):**

```typescript
async updateProfileImage(userId: string, fileUrl: string) {
  return this.prisma.user.update({
    where: { id: userId },
    data: { profileImage: fileUrl }, // e.g., "https://..."
  });
}
```

**After (with MinIO):**

```typescript
async updateProfileImage(userId: string, file: Express.Multer.File) {
  const objectKey = await this.storageService.uploadFile(
    file,
    'profiles',
    `users/${userId}/profile-${Date.now()}.jpg`,
  );

  return this.prisma.user.update({
    where: { id: userId },
    data: { profileImage: objectKey }, // e.g., "users/{userId}/profile-*.jpg"
  });
}
```

### Step 4: Update Controllers

Replace direct file handling with StorageService:

```typescript
@Post('profile/upload')
@UseInterceptors(FileInterceptor('profileImage'))
async uploadProfileImage(
  @UploadedFile() file: Express.Multer.File,
  @GetUser('userId') userId: string,
) {
  return this.userService.uploadProfileImage(userId, file);
}
```

### Step 5: Handle File Retrieval in APIs

When returning file data, generate presigned URLs:

```typescript
// In service
async getUserProfile(userId: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });

  let profileImageUrl = null;
  if (user.profileImage) {
    profileImageUrl = await this.storageService.getPresignedDownloadUrl(
      user.profileImage,
      'profiles',
    );
  }

  return {
    ...user,
    profileImageUrl, // Return URL instead of objectKey
  };
}
```

## Files That Need MinIO Integration

Based on your schema, update these entities:

### 1. User Profile Image

- Field: `User.profileImage`
- Bucket: `profiles`
- Path pattern: `users/{userId}/profile-*.jpg`

### 2. Business Logo & Images

- Fields: `Business.logo`, `BusinessImage.imageUrl`
- Bucket: `businesses`
- Path patterns:
  - Logo: `businesses/{businessId}/logo-*.jpg`
  - Images: `businesses/{businessId}/images/*.jpg`

### 3. Category Image

- Field: `Category.image`
- Bucket: `categories`
- Path pattern: `categories/{categoryId}/*`

### 4. Vendor Profile (if applicable)

- Field: `User.profileImage` (same as User)
- Bucket: `profiles`

### 5. Guest Customer Image

- Field: `GuestCustomer.image`
- Bucket: `businesses` (or separate bucket)
- Path pattern: `guests/{guestId}/*`

## Implementation Checklist

- [ ] Install MinIO and update `.env`
- [ ] Verify `StorageModule` is imported in `AppModule`
- [ ] Create/update file upload controller(s)
- [ ] Update existing services to use `StorageService`
- [ ] Add file validation (MIME type, size)
- [ ] Test file upload/download endpoints
- [ ] Add cleanup logic when records are deleted
- [ ] Update API documentation with new endpoints
- [ ] Test presigned URL generation and expiration
- [ ] Monitor MinIO storage usage

## Data Migration (If Migrating Existing Files)

If you have existing files stored elsewhere, create a migration script:

```typescript
// scripts/migrate-files-to-minio.ts
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { StorageService } from "../src/storage/storage.service";

const prisma = new PrismaClient();

async function migrateUserProfiles() {
  const users = await prisma.user.findMany({
    where: { profileImage: { not: null } },
  });

  for (const user of users) {
    try {
      // Download old file
      const response = await axios.get(user.profileImage, {
        responseType: "arraybuffer",
      });

      // Create mock file object
      const file = {
        buffer: response.data,
        size: response.data.length,
        mimetype: "image/jpeg",
        originalname: `profile-${user.id}.jpg`,
      } as Express.Multer.File;

      // Upload to MinIO
      const objectKey = await storageService.uploadFile(
        file,
        "profiles",
        `users/${user.id}/profile-migrated.jpg`,
      );

      // Update database
      await prisma.user.update({
        where: { id: user.id },
        data: { profileImage: objectKey },
      });

      console.log(`✓ Migrated profile image for user ${user.id}`);
    } catch (error) {
      console.error(`✗ Failed to migrate user ${user.id}:`, error.message);
    }
  }
}

migrateUserProfiles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Testing

Create test endpoints to verify MinIO integration:

```typescript
@Get('test/upload')
async testUpload() {
  // Test file upload
  const testFile: Express.Multer.File = {
    buffer: Buffer.from('test content'),
    size: 12,
    mimetype: 'text/plain',
    originalname: 'test.txt',
  } as any;

  const objectKey = await this.storageService.uploadFile(
    testFile,
    'profiles',
  );

  const url = await this.storageService.getPresignedDownloadUrl(
    objectKey,
    'profiles',
  );

  await this.storageService.deleteFile(objectKey, 'profiles');

  return { objectKey, url, message: 'MinIO is working correctly!' };
}
```

## Rollback Plan

If you need to rollback:

1. Keep backups of original files
2. Store original URLs in a separate field temporarily
3. Test with new files on separate bucket first
4. Gradual migration approach: migrate endpoints one at a time
