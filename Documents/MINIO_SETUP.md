# MinIO File Storage Setup Guide

## Overview

MinIO is an S3-compatible object storage system used to manage all file uploads in this application. Instead of storing files locally or in the database, files are uploaded to MinIO buckets and referenced by their object keys in the database.

## Architecture

```
File Upload Request
        ↓
   [StorageService]
        ↓
   [MinIO Bucket]
     (profiles,
     businesses,
     categories,
     reviews,
     documents)
        ↓
   [Database - Stores Object Key]
```

## Environment Setup

### Local Development with Docker

1. **Start MinIO using Docker Compose**:

```bash
# Create a docker-compose.yml file (if not already present)
docker-compose up -d
```

MinIO Console will be available at: `http://localhost:9001`

- Default credentials: `minioadmin` / `minioadmin`

2. **Update `.env` file**:

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=devscout
```

### Production Setup

1. **Install MinIO on your server** or use a managed service (AWS S3, DigitalOcean Spaces, etc.)

2. **Update `.env` for production**:

```env
MINIO_ENDPOINT=minio.yourcompany.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-secure-key
MINIO_SECRET_KEY=your-secure-secret
MINIO_BUCKET_NAME=devscout-prod
```

## Bucket Organization

Automatically created on first run:

- **devscout-profiles**: User and vendor profile images
- **devscout-businesses**: Business logos and images
- **devscout-categories**: Category images
- **devscout-reviews**: Review images
- **devscout-documents**: General documents and files

## Database Schema

All file-related fields now store **MinIO object keys**, not URLs:

```prisma
model User {
  profileImage String? // Stores: "users/uuid/profile-123456.jpg"
}

model Business {
  logo  String?        // Stores: "businesses/uuid/logo-123456.jpg"
}

model BusinessImage {
  imageUrl String      // Stores: "businesses/uuid/image-123456.jpg"
}
```

## Using the StorageService

### Injecting in Your Service

```typescript
import { Injectable } from "@nestjs/common";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class UserService {
  constructor(private storageService: StorageService) {}
}
```

### Upload File Example

```typescript
async uploadProfileImage(file: Express.Multer.File, userId: string): Promise<string> {
  // Upload to MinIO
  const objectKey = await this.storageService.uploadFile(
    file,
    'profiles', // bucket type
    `users/${userId}/profile-${Date.now()}.jpg`
  );

  // Save object key to database
  await this.prisma.user.update({
    where: { id: userId },
    data: { profileImage: objectKey }
  });

  return objectKey;
}
```

### Retrieve File URL

```typescript
async getProfileImageUrl(objectKey: string): Promise<string> {
  // Generate presigned URL for secure access
  return this.storageService.getPresignedDownloadUrl(
    objectKey,
    'profiles',
    86400 // 24 hours expiration
  );
}
```

### Delete File

```typescript
async deleteProfileImage(objectKey: string): Promise<void> {
  await this.storageService.deleteFile(objectKey, 'profiles');
}
```

## Controller Implementation

```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserService } from "./user.service";
import { GetUser } from "../common/decorators/get-user.decorator";

@Controller("api/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Post("profile/upload")
  @UseInterceptors(FileInterceptor("profileImage"))
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @GetUser("userId") userId: string,
  ) {
    const objectKey = await this.userService.uploadProfileImage(file, userId);
    return {
      success: true,
      objectKey,
      message: "Profile image uploaded successfully",
    };
  }

  @Get("profile/image/:userId")
  async getProfileImage(@Param("userId") userId: string) {
    const user = await this.userService.findById(userId);
    if (!user.profileImage) {
      return { imageUrl: null };
    }

    const imageUrl = await this.userService.getProfileImageUrl(
      user.profileImage,
    );
    return { imageUrl };
  }
}
```

## File Upload Flow

1. **Client uploads file** → POST `/api/users/profile/upload`
2. **Controller receives file** → Validates and calls service
3. **Service uploads to MinIO** → Gets object key back
4. **Save object key to DB** → Stores reference
5. **Return object key/URL to client**

```
Client (Browser)
    ↓
  POST /api/users/profile/upload (multipart/form-data)
    ↓
  [UserController]
    ↓
  [UserService]
    ↓
  [StorageService]
    ↓
  [MinIO] ← File stored here
    ↓
  [Database] ← Object key stored here
    ↓
  Response with objectKey/URL to Client
```

## API Response Format

### Upload Response

```json
{
  "success": true,
  "objectKey": "users/550e8400-e29b-41d4-a716-446655440000/profile-1711270000000.jpg",
  "imageUrl": "http://localhost:9000/devscout-profiles/users/550e8400-e29b-41d4-a716-446655440000/profile-1711270000000.jpg",
  "message": "File uploaded successfully"
}
```

### Retrieve Response

```json
{
  "imageUrl": "http://localhost:9000/devscout-profiles/users/550e8400-e29b-41d4-a716-446655440000/profile-1711270000000.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
}
```

## Security Features

1. **Presigned URLs**: Temporary URLs with expiration (default: 24 hours)
2. **Access Control**: MinIO user permissions at bucket level
3. **Validation**: Check file type and size before upload
4. **Cleanup**: Delete files when records are removed

## Troubleshooting

### MinIO Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:9000
```

**Solution**: Ensure MinIO is running and accessible:

```bash
docker-compose ps
docker logs minio
```

### File Upload Fails

```
BadRequestException: No file provided
```

**Solution**: Ensure form data has correct field name and file is being sent

### Presigned URL Invalid

**Solution**: Check URL expiration time hasn't passed

## Next Steps

1. Update all existing file-related endpoints to use StorageService
2. Migrate existing files to MinIO (if migrating from local storage)
3. Add file validation (size, MIME type) in controllers
4. Implement cleanup tasks for orphaned files
5. Monitor MinIO storage usage

## Useful Commands

```bash
# View MinIO logs
docker logs -f minio

# Access MinIO console (local)
open http://localhost:9001

# Create new bucket via CLI (if needed)
mc mb minio/devscout-new-bucket

# List bucket contents
mc ls minio/devscout-profiles/
```
