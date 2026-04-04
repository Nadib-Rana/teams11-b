# File Management System - FAQ & Troubleshooting

## 🆘 Common Issues & Solutions

---

## ❌ Problem: "No file provided" error

### Symptom

```json
{
  "statusCode": 400,
  "message": "No file provided"
}
```

### Causes

- Missing `form-data` key name (should be `profileImage`, `logo`, or `images`)
- File not attached to request body
- Wrong Content-Type (should be `multipart/form-data`)

### Solutions

**Using cURL:**

```bash
# ❌ WRONG - no -F parameter
curl -X POST http://localhost:3000/api/files/profile-image

# ✅ CORRECT
curl -X POST http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "profileImage=@image.jpg"
```

**Using Postman:**

1. Go to "Body" tab
2. Select "form-data" (NOT raw)
3. Key: `profileImage`
4. Value: Select file from computer
5. Send

**Using JavaScript:**

```javascript
// ❌ WRONG
const formData = new FormData();
formData.append("file", file); // Wrong key name!

// ✅ CORRECT
const formData = new FormData();
formData.append("profileImage", file); // Correct key name
```

---

## ❌ Problem: "Only image files are allowed" error

### Symptom

```json
{
  "statusCode": 400,
  "message": "Only image files are allowed"
}
```

### Causes

- File MIME type not recognized
- Uploading non-image file (PDF, doc, etc.)
- File extension doesn't match MIME type

### Solutions

**Check file type:**

```bash
# Check what MIME type a file has
file -i image.jpg
# Should show: image/jpeg

# List allowed types
# image/jpeg, image/jpg, image/png, image/gif, image/webp
```

**For online images, download and re-save:**

```bash
# Download an image
curl https://example.com/image.jpg -o downloaded.jpg

# Then upload
curl -X POST http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "profileImage=@downloaded.jpg"
```

**Allowed Image Types:**

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

---

## ❌ Problem: "Payload Too Large" or file size exceeded

### Symptom

```json
{
  "statusCode": 413,
  "message": "Payload Too Large"
}
```

### Size Limits

- Profile Images: **5MB** max
- Business Logo: **5MB** max
- Business Gallery Images: **10MB** max
- Review Images: **5MB** max

### Solutions

**Check file size:**

```bash
# Linux/Mac
ls -lh image.jpg
# Shows: -rw-r--r--  1 user  staff  12M  Apr 15 10:30 image.jpg

# If it's 12MB, it's too large
```

**Compress image:**

```bash
# Using ImageMagick
convert input.jpg -quality 85 -resize 1920x1440\> output.jpg

# Using FFmpeg
ffmpeg -i input.jpg -q:v 5 output.jpg

# Using online tools
# https://imagecompressor.com/
# https://tinypng.com/
```

**Optimize before upload:**

```javascript
// JavaScript - Compress before upload
async function compressAndUpload(file) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const img = new Image();
  img.onload = () => {
    // Scale down to max 1920px
    const maxSize = 1920;
    let width = img.width;
    let height = img.height;

    if (width > height && width > maxSize) {
      height = (height * maxSize) / width;
      width = maxSize;
    } else if (height > maxSize) {
      width = (width * maxSize) / height;
      height = maxSize;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      async (blob) => {
        const formData = new FormData();
        formData.append("profileImage", blob, "compressed.jpg");

        const response = await fetch("/api/files/profile-image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      },
      "image/jpeg",
      0.85,
    );
  };
  img.src = URL.createObjectURL(file);
}
```

---

## ❌ Problem: "Unauthorized" when uploading

### Symptom

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Causes

- Missing Authorization header
- Invalid or expired JWT token
- Wrong token format

### Solutions

**Check token is present:**

```bash
# ❌ WRONG - no Authorization header
curl -X POST http://localhost:3000/api/files/profile-image \
  -F "profileImage=@image.jpg"

# ✅ CORRECT - with Authorization header
curl -X POST http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "profileImage=@image.jpg"
```

**Check token format:**

```bash
# Token should be in format: "Bearer <token>"
# NOT: "Token <token>" or just "<token>"

curl -H "Authorization: Bearer $JWT_TOKEN" ...
```

**Get new token if expired:**

```bash
# Login to get fresh token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Extract token and use in next requests
export JWT_TOKEN="new_token_here"
```

**Check token expiration:**

```javascript
// Decode JWT to see expiration
function decodeToken(token) {
  const parts = token.split(".");
  const payload = JSON.parse(atob(parts[1]));

  console.log("Expires at:", new Date(payload.exp * 1000));
  console.log("Token valid:", Date.now() < payload.exp * 1000);

  return payload;
}
```

---

## ❌ Problem: MinIO bucket not found

### Symptom

```
Error: The specified bucket does not exist
or
Error: Bucket 'voices-profiles' not found
```

### Causes

- MinIO service not running
- Buckets not created yet
- Wrong bucket name

### Solutions

**Check if MinIO is running:**

```bash
# Check if service is up
curl http://localhost:9010/minio/health/live
# Should return 200 OK

# If not running
docker-compose up -d minio
```

**Check if buckets exist:**

```bash
# View MinIO console
# http://localhost:9001
# Username: minioadmin
# Password: minioadmin123

# Or check with CLI
docker exec minio_teams11_container mc ls minio/
```

**Create buckets manually:**

```bash
# Using MinIO client
docker exec minio_teams11_container \
  mc mb minio/voices-profiles

docker exec minio_teams11_container \
  mc mb minio/voices-businesses

docker exec minio_teams11_container \
  mc mb minio/voices-categories

docker exec minio_teams11_container \
  mc mb minio/voices-reviews
```

**Check application logs:**

```bash
# When app starts, check for bucket creation messages
bun run start:dev

# Look for:
# ✓ Created MinIO bucket: voices-profiles
# or
# ✗ Failed to create/check bucket: ...
```

---

## ❌ Problem: ECONNREFUSED when uploading

### Symptom

```
Error: connect ECONNREFUSED 127.0.0.1:9000
or
Error: getaddrinfo ENOTFOUND minio
```

### Causes

- MinIO not running
- Wrong MinIO hostname/port in config
- Network connectivity issue (Docker)

### Solutions

**Check environment variables:**

```bash
# In .env file, should have:
MINIO_ENDPOINT=minio          # or localhost if running locally
MINIO_PORT=9000               # Default MinIO API port
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false
```

**Start MinIO if using Docker:**

```bash
# Start all services
docker-compose up -d

# Check if running
docker-compose ps
# Should show minio service as 'Up'
```

**Test MinIO connection:**

```bash
# From within Docker container
docker exec team11_backend_app bash -c \
  "curl http://minio:9000/minio/health/live"

# Should return 200 OK
```

**Check Docker network:**

```bash
# Make sure app and MinIO are on same network
docker-compose exec app ping minio
# Should get responses
```

---

## ❌ Problem: "Invalid useSSL flag type"

### Symptom

```
InvalidArgumentError: Invalid useSSL flag type : false, expected to be of type 'boolean'
```

### Causes

- Environment variable `MINIO_USE_SSL` is string "false" instead of boolean false
- Type conversion issue in application startup

### Solutions

**This is already fixed in the code, but if you see it:**

```typescript
// In src/storage/minio.config.ts
// ✅ CORRECT - converts string to boolean
const useSSLStr = this.configService.get<string>("MINIO_USE_SSL", "false");
const useSSL = useSSLStr.toLowerCase() === "true";

this.minioClient = new Minio.Client({
  useSSL: useSSL, // Now it's boolean
  // ... other config
});
```

---

## ❌ Problem: Presigned URL not working/expired

### Symptom

```
"AccessDenied" error when accessing presigned URL
or
URL returns 404 after 24 hours
```

### Causes

- URL has expired (default 24 hours)
- ObjectKey doesn't exist in MinIO
- Wrong bucket name

### Solutions

**Generate new URL:**

```bash
# Get new presigned URL
curl -X GET "http://localhost:3000/api/files/profile-image/$OBJECT_KEY" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Store returned URL before it expires
```

**Check if file exists:**

```bash
# Using MinIO console or CLI
docker exec minio_teams11_container \
  mc ls minio/voices-profiles/ | grep "your-object-key"

# Or in app
const exists = await storage.fileExists(objectKey, 'profiles');
console.log(exists); // Should be true
```

**Extend URL expiration:**

```typescript
// In your service, increase expiration time
const url = await this.storage.getPresignedDownloadUrl(
  objectKey,
  "profiles",
  86400 * 7, // 7 days instead of 1 day
);
```

---

## ❌ Problem: Can't download image from presigned URL

### Symptom

```
404 Not Found
or
"InvalidBucketName" error
or
403 Access Denied
```

### Causes

- File was deleted
- Wrong objectKey stored
- MinIO permissions issue
- CORS not configured

### Solutions

**Verify objectKey in database:**

```prisma
// prisma/schema.prisma
model User {
  id            String    @id
  profileImage  String?   // Should contain objectKey, not URL
}
```

**Check file in MinIO:**

```bash
# List all files in bucket
docker exec minio_teams11_container \
  mc ls -R minio/voices-profiles/

# Look for your objectKey in output
```

**Configure CORS (if needed):**

```bash
# In MinIO console, go to bucket → Settings → CORS
# Or use CLI
docker exec minio_teams11_container \
  mc cp - minio/voices-profiles/.cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
      "AllowedMethods": ["GET", "HEAD", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
```

---

## ❌ Problem: Storage Service not injected

### Symptom

```
Error: Nest can't resolve dependencies of the XyzService
```

### Causes

- StorageModule not imported in feature module
- StorageService not exported from StorageModule
- Circular dependencies

### Solutions

**Import StorageModule:**

```typescript
// src/business/business.module.ts
import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule], // Add this
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}
```

**Verify StorageModule exports:**

```typescript
// src/storage/storage.module.ts
@Module({
  imports: [ConfigModule],
  providers: [StorageService, MinioConfigService],
  exports: [StorageService], // Must export!
})
export class StorageModule {}
```

---

## ❌ Problem: Database doesn't match file storage

### Symptom

- File exists in MinIO but database shows null
- Database has objectKey but file not in MinIO
- Orphaned files after deletion

### Causes

- Transaction failures
- Incomplete uploads
- Database & MinIO out of sync

### Solutions

**Find orphaned files:**

```bash
# Compare files in MinIO vs database
docker exec minio_teams11_container \
  mc ls -R minio/voices-profiles/

# Then query database
SELECT id, profileImage FROM "User" WHERE profileImage IS NOT NULL;
```

**Clean up orphaned files:**

```bash
# Delete files from MinIO if not in database
docker exec minio_teams11_container \
  mc rm minio/voices-profiles/orphaned-file.jpg
```

**Re-sync database:**

```typescript
// Update database to match actual files
const user = await prisma.user.findUnique({ where: { id: userId } });
const fileExists = await storage.fileExists(user.profileImage, "profiles");

if (!fileExists) {
  // File was deleted, update database
  await prisma.user.update({
    where: { id: userId },
    data: { profileImage: null },
  });
}
```

---

## 📋 Debugging Checklist

- [ ] MinIO service is running (`docker-compose ps`)
- [ ] Token is valid and not expired
- [ ] File is < 5MB for most uploads
- [ ] File is supported image type (jpg, png, gif, webp)
- [ ] StorageModule imported in your feature module
- [ ] ObjectKey stored in database, not URL
- [ ] Using correct bucket type ('profiles', 'businesses', etc.)
- [ ] MINIO_USE_SSL is converted to boolean
- [ ] Presigned URL generated right before use
- [ ] File exists in MinIO before deleting from app

---

## 🔍 How to Debug

### Enable verbose logging:

```typescript
// Add to storage.service.ts
import { Logger } from "@nestjs/common";

@Injectable()
export class StorageService {
  private logger = new Logger("StorageService");

  async uploadFile(file, bucketType, customObjectName) {
    this.logger.log(`Uploading to ${bucketType}: ${customObjectName}`);
    try {
      const objectName = await this.minioConfig.uploadFile(
        file,
        bucketType,
        customObjectName,
      );
      this.logger.log(`✓ Uploaded: ${objectName}`);
      return objectName;
    } catch (error) {
      this.logger.error(`✗ Upload failed: ${error.message}`);
      throw error;
    }
  }
}
```

### Check MinIO logs:

```bash
docker-compose logs -f minio
```

### Check PostgreSQL:

```bash
# Connect to database
docker-compose exec postgres psql -U nest_js -d teams11_nest_js

# Query user images
SELECT id, email, profile_image FROM "User" LIMIT 10;
```

### Test with minimal example:

```bash
# 1. Get token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' | jq -r '.access_token')

# 2. Upload
RESPONSE=$(curl -X POST http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "profileImage=@test.jpg")

# 3. Extract objectKey
OBJECT_KEY=$(echo $RESPONSE | jq -r '.objectKey')

# 4. Get URL
curl -X GET "http://localhost:3000/api/files/profile-image/$OBJECT_KEY" \
  -H "Authorization: Bearer $TOKEN"

# 5. Download
curl "http://minio:9010/voices-profiles/$OBJECT_KEY?..." -o downloaded.jpg
```

---

## 📞 Still Having Issues?

### Check these files:

1. [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Complete API documentation
2. [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) - Step-by-step testing
3. [FILE_INTEGRATION_GUIDE.md](./FILE_INTEGRATION_GUIDE.md) - Integration examples
4. [TEST_RESULTS.md](./TEST_RESULTS.md) - Known issues and fixes

### Review the code:

- `src/storage/minio.config.ts` - MinIO configuration
- `src/storage/storage.service.ts` - Core upload/delete logic
- `src/storage/file-upload.controller.ts` - HTTP endpoints
- `src/storage/constants.ts` - File size & type limits

### Common command reference:

```bash
# Restart services
docker-compose restart

# View logs
docker-compose logs -f app

# Check MinIO console
# http://localhost:9001

# List all buckets
docker exec minio_teams11_container mc ls minio/

# Remove bucket (empty only)
docker exec minio_teams11_container mc rb minio/voices-profiles

# Reset MinIO
docker-compose down
docker volume rm team11_minio_data
docker-compose up -d minio
```
