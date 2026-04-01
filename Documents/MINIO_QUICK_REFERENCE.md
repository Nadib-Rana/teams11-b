# MinIO File Upload - Quick Reference

## Essential Files Created

```
src/storage/
├── minio.config.ts          # MinIO connection config
├── storage.service.ts       # Core file operations
├── storage.module.ts        # NestJS module
├── file-upload.controller.ts # Example implementation
└── README.md               # Detailed API docs

Root files:
├── .env.example            # Environment template
├── MINIO_SETUP.md          # Complete setup guide
├── DATABASE_MIGRATION_GUIDE.md # Migration instructions
└── SETUP_COMPLETE.md       # This complete guide
```

## Environment Configuration

```env
MINIO_ENDPOINT=minio
MINIO_PORT=9010
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=devscout
```

## Basic Usage Pattern

```typescript
// 1. Inject StorageService
constructor(private storageService: StorageService) {}

// 2. Upload file
const objectKey = await this.storageService.uploadFile(
  file,
  'profiles',
  `users/${userId}/profile.jpg`
);

// 3. Save object key to database (not URL)
await this.prisma.user.update({
  where: { id: userId },
  data: { profileImage: objectKey }
});

// 4. Generate URL when needed
const url = await this.storageService.getPresignedDownloadUrl(
  objectKey,
  'profiles'
);
```

## Available Bucket Types

- `'profiles'` - User/vendor profile images
- `'businesses'` - Business logos and images
- `'categories'` - Category images
- `'reviews'` - Review images
- `'documents'` - General documents

## Key Methods

```typescript
// Upload
uploadFile(file, bucketType, customName?)
uploadMultipleFiles(files, bucketType)

// Download
getPresignedDownloadUrl(objectName, bucketType, expiresIn?)
getObjectUrl(objectName, bucketType) // Direct URL
getPresignedUploadUrl(objectName, bucketType, expiresIn?) // For client uploads

// Management
deleteFile(objectName, bucketType)
fileExists(objectName, bucketType)
```

## MinIO Console

Access at: `http://localhost:9001`

- Username: minioadmin
- Password: minioadmin123

## Testing Endpoints

```bash
# Upload profile image
curl -X POST http://localhost:3000/api/files/profile-image \
  -F "profileImage=@image.jpg" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get presigned URL
curl http://localhost:3000/api/files/profile-image/users/{userId}/profile.jpg

# Delete profile image
curl -X DELETE http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Schema - File Fields

Always store object keys:

```prisma
model User {
  profileImage String? // "users/{id}/profile.jpg"
}

model Business {
  logo String?  // "businesses/{id}/logo.jpg"
}

model BusinessImage {
  imageUrl String // "businesses/{id}/images/img.jpg"
}
```

## Why This Approach?

1. **Flexible** - Change MinIO endpoint without DB updates
2. **Secure** - URLs are temporary and self-expiring
3. **Scalable** - Easy to add new buckets/file types
4. **Clean** - Clear separation of concerns
5. **Standard** - Follows cloud-native best practices

---

**See SETUP_COMPLETE.md for detailed instructions** ✅
