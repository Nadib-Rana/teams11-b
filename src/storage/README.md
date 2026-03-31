# MinIO File Storage

This module provides a complete file management system using MinIO (S3-compatible object storage).

## Configuration

Set up the following environment variables in your `.env` file:

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=devscout
```

## Bucket Types

Files are organized by type in separate buckets:

- **profiles** - User and vendor profile images
- **businesses** - Business logos and images
- **categories** - Category images
- **reviews** - Review images
- **documents** - General documents

Bucket names follow the pattern: `{MINIO_BUCKET_NAME}-{type}` (e.g., `devscout-profiles`)

## Usage

### In a NestJS Service

```typescript
import { Injectable } from "@nestjs/common";
import { StorageService } from "./storage/storage.service";

@Injectable()
export class UserService {
  constructor(private storageService: StorageService) {}

  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    // Upload file and get object key
    const objectName = await this.storageService.uploadFile(
      file,
      "profiles",
      `users/${userId}/profile-${Date.now()}.jpg`,
    );

    // Store the objectName in database instead of file path
    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: objectName }, // Store key, not URL
    });

    return objectName;
  }

  async getProfileImageUrl(objectName: string): Promise<string> {
    // Generate presigned URL when needed
    return this.storageService.getPresignedDownloadUrl(
      objectName,
      "profiles",
      86400, // 24 hours
    );
  }

  async deleteProfileImage(objectName: string): Promise<void> {
    await this.storageService.deleteFile(objectName, "profiles");
  }
}
```

### Methods Available

#### Upload Files

```typescript
// Single file upload
const objectName = await storageService.uploadFile(file, "profiles");

// Multiple files
const objectNames = await storageService.uploadMultipleFiles(
  files,
  "businesses",
);

// Custom object name
const objectName = await storageService.uploadFile(
  file,
  "profiles",
  "users/123/avatar.jpg",
);
```

#### Delete Files

```typescript
await storageService.deleteFile(objectName, "profiles");
```

#### Generate URLs

```typescript
// Presigned download URL (temporary, expires in 24h by default)
const downloadUrl = await storageService.getPresignedDownloadUrl(
  objectName,
  "profiles",
  86400, // seconds
);

// Presigned upload URL (for direct client uploads)
const uploadUrl = await storageService.getPresignedUploadUrl(
  objectName,
  "profiles",
  3600, // seconds
);

// Direct object URL (for public files)
const directUrl = storageService.getObjectUrl(objectName, "profiles");
```

#### Check File Existence

```typescript
const exists = await storageService.fileExists(objectName, "profiles");
```

## Database Schema Updates

Update your Prisma schema to store object keys instead of full URLs:

```prisma
model User {
  id            String    @id @default(uuid()) @db.Uuid
  profileImage  String?   @map("profile_image") // Store MinIO object key
  // ... other fields
}

model Business {
  id    String @id @default(uuid()) @db.Uuid
  logo  String? // Store MinIO object key
  // ... other fields
}

model BusinessImage {
  id       String   @id @default(uuid()) @db.Uuid
  imageUrl String   @map("image_url") // Store MinIO object key
  // ... other fields
}
```

## Best Practices

1. **Store Keys, Not URLs**: Save only the object key in the database
2. **Organize by User/Entity**: Use structured paths like `users/{userId}/profile.jpg`
3. **Generate URLs on Demand**: Create URLs only when needed (API responses)
4. **Use Presigned URLs**: For temporary access to private files
5. **Clean Up**: Delete old files when records are deleted
6. **Validate on Upload**: Check file types and sizes before uploading

## Docker Compose Example

```yaml
services:
  minio:
    image: quay.io/minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  minio_data:
```

## Security Considerations

1. **Access Control**: Set proper IAM policies for MinIO
2. **SSL/TLS**: Enable `MINIO_USE_SSL=true` in production
3. **Presigned URLs**: Always set reasonable expiration times
4. **Credentials**: Use strong access keys and secret keys
5. **Buckets**: Set appropriate bucket policies for public/private files
