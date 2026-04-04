# File Management API Endpoints

## Base URL

```
http://localhost:3000/api/files
```

> **Authentication**: All endpoints require JWT token in Authorization header
>
> ```
> Authorization: Bearer YOUR_JWT_TOKEN
> ```

---

## 📋 Endpoints Summary

| Endpoint                       | Method | Description                         | Authentication           |
| ------------------------------ | ------ | ----------------------------------- | ------------------------ |
| `/profile-image`               | POST   | Upload user profile image           | Required (Auto-detected) |
| `/profile-image/:objectKey`    | GET    | Get presigned URL for profile image | Optional                 |
| `/profile-image`               | DELETE | Delete user profile image           | Required (Auto-detected) |
| `/business-logo/:businessId`   | POST   | Upload business logo                | Required (Manual)        |
| `/business-images/:businessId` | POST   | Upload business image               | Required (Manual)        |
| `/business-images/:imageId`    | DELETE | Delete business image               | Required (Manual)        |

---

# 1️⃣ USER PROFILE IMAGE ENDPOINTS

## 1.1 Upload Profile Image

**Endpoint**: `POST /api/files/profile-image`

**Authentication**: Required (Auto-extracted from JWT)

**Request Body** (multipart/form-data):

```
- profileImage: File (required, max 5MB)
  - Accepted formats: jpg, jpeg, png, gif
```

### Response Format

**Success (201/200)**:

```json
{
  "success": true,
  "objectKey": "users/550e8400-e29b-41d4-a716-446655440000/profile-1711938000000.jpg",
  "imageUrl": "http://minio:9010/voices-profiles/users/550e8400-e29b-41d4-a716-446655440000/profile-1711938000000.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
  "message": "Profile image uploaded successfully"
}
```

**Error (400)**:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Only image files are allowed",
  "error": "Bad Request"
}
```

### Demo - cURL

```bash
# Upload profile image
curl -X POST http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profileImage=@/path/to/profile.jpg"

# Response (example)
{
  "success": true,
  "objectKey": "users/user-123/profile-1711938000000.jpg",
  "imageUrl": "http://minio:9010/voices-profiles/users/user-123/profile-1711938000000.jpg?...",
  "message": "Profile image uploaded successfully"
}
```

### Demo - JavaScript/TypeScript

```typescript
// Frontend - React Example
const uploadProfileImage = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append("profileImage", file);

  const response = await fetch(
    "http://localhost:3000/api/files/profile-image",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  const data = await response.json();
  console.log(data.objectKey); // Save to user profile
  console.log(data.imageUrl); // Display image
  return data;
};

// Usage
const file = event.target.files[0];
const result = await uploadProfileImage(file, jwtToken);
```

---

## 1.2 Get Profile Image (Presigned URL)

**Endpoint**: `GET /api/files/profile-image/:objectKey`

**Parameters**:

- `objectKey` (path): The object key returned from upload endpoint

**Authentication**: Optional (but recommended for private images)

**Response Format**:

```json
{
  "imageUrl": "http://minio:9010/voices-profiles/users/550e8400-e29b-41d4-a716-446655440000/profile-1711938000000.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%3A20260401T000000Z%2F20260401%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260401T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=..."
}
```

### Demo - cURL

```bash
# Get presigned URL for image (valid for 24 hours)
curl -X GET "http://localhost:3000/api/files/profile-image/users/user-123/profile-1711938000000.jpg" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response
{
  "imageUrl": "http://minio:9010/voices-profiles/users/user-123/profile-1711938000000.jpg?X-Amz..."
}
```

### Demo - JavaScript/TypeScript

```typescript
// Get presigned URL
const getProfileImageUrl = async (objectKey: string, token: string) => {
  const response = await fetch(
    `http://localhost:3000/api/files/profile-image/${encodeURIComponent(objectKey)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();
  return data.imageUrl;
};

// Usage - Display image in HTML
const imageUrl = await getProfileImageUrl(objectKey, token);
document.getElementById("profile").src = imageUrl;
```

---

## 1.3 Delete Profile Image

**Endpoint**: `DELETE /api/files/profile-image`

**Authentication**: Required (Auto-extracted from JWT)

**Request Body**: None

**Response Format**:

```json
{
  "success": true,
  "message": "Profile image deleted successfully"
}
```

**Error (400)**:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "No profile image to delete",
  "error": "Bad Request"
}
```

### Demo - cURL

```bash
# Delete profile image
curl -X DELETE http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response
{
  "success": true,
  "message": "Profile image deleted successfully"
}
```

### Demo - JavaScript/TypeScript

```typescript
// Delete profile image
const deleteProfileImage = async (token: string) => {
  const response = await fetch(
    "http://localhost:3000/api/files/profile-image",
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json();
  return data;
};

// Usage
const result = await deleteProfileImage(token);
if (result.success) {
  console.log("Image deleted");
}
```

---

# 2️⃣ BUSINESS LOGO ENDPOINT

## 2.1 Upload Business Logo

**Endpoint**: `POST /api/files/business-logo/:businessId`

**Parameters**:

- `businessId` (path): Business ID from URL

**Authentication**: Required (Must send JWT with business owner role)

**Request Body** (multipart/form-data):

```
- logo: File (required, max 5MB)
  - Accepted formats: jpg, jpeg, png, gif
```

**Response Format**:

```json
{
  "success": true,
  "objectKey": "businesses/business-456/logo-1711938000000.jpg",
  "imageUrl": "http://minio:9010/voices-businesses/businesses/business-456/logo-1711938000000.jpg?X-Amz...",
  "message": "Business logo uploaded successfully"
}
```

### Demo - cURL

```bash
# Upload business logo
curl -X POST http://localhost:3000/api/files/business-logo/business-456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "logo=@/path/to/logo.png"

# Response
{
  "success": true,
  "objectKey": "businesses/business-456/logo-1711938000000.jpg",
  "imageUrl": "http://minio:9010/voices-businesses/businesses/business-456/logo-1711938000000.jpg?...",
  "message": "Business logo uploaded successfully"
}
```

### Demo - JavaScript/TypeScript

```typescript
// Upload business logo
const uploadBusinessLogo = async (
  businessId: string,
  file: File,
  token: string,
) => {
  const formData = new FormData();
  formData.append("logo", file);

  const response = await fetch(
    `http://localhost:3000/api/files/business-logo/${businessId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  const data = await response.json();
  return data;
};

// Usage
const logoFile = document.getElementById("logo-input").files[0];
const result = await uploadBusinessLogo(businessId, logoFile, token);
console.log(result.objectKey); // Save to business record
console.log(result.imageUrl); // Display logo
```

---

# 3️⃣ BUSINESS IMAGES ENDPOINTS

## 3.1 Upload Business Image (Gallery)

**Endpoint**: `POST /api/files/business-images/:businessId`

**Parameters**:

- `businessId` (path): Business ID from URL

**Authentication**: Required

**Request Body** (multipart/form-data):

```
- images: File (required, max 5MB)
  - Accepted formats: jpg, jpeg, png, gif
```

**Response Format**:

```json
{
  "success": true,
  "imageId": "image-789",
  "objectKey": "businesses/business-456/images/1711938000000-photo.jpg",
  "message": "Business image uploaded successfully"
}
```

### Demo - cURL

```bash
# Upload business image
curl -X POST http://localhost:3000/api/files/business-images/business-456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@/path/to/gallery-photo.jpg"

# Response
{
  "success": true,
  "imageId": "550e8400-e29b-41d4-a716-446655440001",
  "objectKey": "businesses/business-456/images/1711938000000-photo.jpg",
  "message": "Business image uploaded successfully"
}
```

### Demo - JavaScript/TypeScript

```typescript
// Upload business image
const uploadBusinessImage = async (
  businessId: string,
  file: File,
  token: string,
) => {
  const formData = new FormData();
  formData.append("images", file);

  const response = await fetch(
    `http://localhost:3000/api/files/business-images/${businessId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  const data = await response.json();
  return data;
};

// Usage - Single file
const imageFile = document.getElementById("image-input").files[0];
const result = await uploadBusinessImage(businessId, imageFile, token);

// Usage - Multiple files (loop)
const files = document.getElementById("images-input").files;
for (let i = 0; i < files.length; i++) {
  const result = await uploadBusinessImage(businessId, files[i], token);
  console.log(`Image ${i + 1} uploaded:`, result.imageId);
}
```

---

## 3.2 Delete Business Image

**Endpoint**: `DELETE /api/files/business-images/:imageId`

**Parameters**:

- `imageId` (path): Image ID (returned from upload endpoint)

**Authentication**: Required

**Request Body**: None

**Response Format**:

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### Demo - cURL

```bash
# Delete business image
curl -X DELETE http://localhost:3000/api/files/business-images/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### Demo - JavaScript/TypeScript

```typescript
// Delete business image
const deleteBusinessImage = async (imageId: string, token: string) => {
  const response = await fetch(
    `http://localhost:3000/api/files/business-images/${imageId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json();
  return data;
};

// Usage
const result = await deleteBusinessImage(imageId, token);
if (result.success) {
  console.log("Image deleted successfully");
}
```

---

# 📊 Data Format Reference

## File Upload Request

```
Content-Type: multipart/form-data

Key Name: profileImage | logo | images
Value Type: File (binary)
Max Size: 5 MB
Accepted MIME Types: image/jpeg, image/png, image/gif
```

## Response Format - Success

```json
{
  "success": true,
  "objectKey": "string - unique identifier for the file in MinIO",
  "imageUrl": "string - presigned URL (optional, 24hour expiry)",
  "imageId": "string - database ID (optional, for images)",
  "message": "string - human readable message"
}
```

## Response Format - Error

```json
{
  "statusCode": 400 | 401 | 404 | 500,
  "message": "string - error description",
  "error": "BadRequest | Unauthorized | NotFound | InternalServerError",
  "errorMessage": "string - detailed error (optional)"
}
```

---

# 🔐 Common Errors

| Error                        | Status | Cause               | Solution                              |
| ---------------------------- | ------ | ------------------- | ------------------------------------- |
| Only image files are allowed | 400    | Wrong file type     | Upload jpg, jpeg, png, or gif         |
| No file provided             | 400    | File missing        | Ensure file is in form data           |
| File exceeds 5MB limit       | 413    | File too large      | Compress image or upload smaller file |
| No profile image to delete   | 400    | Image doesn't exist | Check if image was uploaded           |
| Image not found              | 404    | Invalid imageId     | Verify imageId from database          |
| Unauthorized                 | 401    | Missing JWT token   | Include Authorization header          |
| Invalid JWT                  | 401    | Expired token       | Refresh and retry with new token      |

---

# 🧪 Complete Example Flow

## Complete User Profile Image Upload Workflow

```typescript
// 1. Get JWT token from login
const loginResponse = await fetch("http://localhost:3000/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com", password: "password" }),
});
const { access_token } = await loginResponse.json();

// 2. Handle file selection
document
  .getElementById("profile-input")
  .addEventListener("change", async (e) => {
    const file = e.target.files[0];

    // 3. Upload file
    const formData = new FormData();
    formData.append("profileImage", file);

    const uploadResponse = await fetch(
      "http://localhost:3000/api/files/profile-image",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${access_token}` },
        body: formData,
      },
    );

    const { objectKey, imageUrl } = await uploadResponse.json();

    // 4. Save objectKey to user profile in database
    await fetch("http://localhost:3000/user/profile", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profileImage: objectKey }),
    });

    // 5. Display image
    document.getElementById("profile-preview").src = imageUrl;
  });

// 6. When retrieving user profile
const userProfile = await fetch("http://localhost:3000/user/profile", {
  headers: { Authorization: `Bearer ${access_token}` },
});
const { profileImage: objectKey } = await userProfile.json();

// 7. Get presigned URL
const imageUrlResponse = await fetch(
  `http://localhost:3000/api/files/profile-image/${objectKey}`,
  { headers: { Authorization: `Bearer ${access_token}` } },
);
const { imageUrl } = await imageUrlResponse.json();

// 8. Display in frontend
document.getElementById("profile-img").src = imageUrl;
```

---

# 📝 Best Practices

## 1. **Always Store Object Key, Not URL**

```typescript
// ✅ CORRECT - Store objectKey in database
await prisma.user.update({
  where: { id: userId },
  data: { profileImage: objectKey }, // "users/123/profile-1711938000000.jpg"
});

// ❌ WRONG - Don't store full URL
await prisma.user.update({
  where: { id: userId },
  data: { profileImage: imageUrl }, // Never do this
});
```

## 2. **Generate URLs on Demand**

```typescript
// ✅ CORRECT - Generate URL when needed
const imageUrl = await storageService.getPresignedDownloadUrl(
  objectKey,
  "profiles",
);

// ❌ WRONG - Don't cache URLs for long periods
const cachedUrl = response.imageUrl; // URLs expire after 24 hours
```

## 3. **Add File Type Validation Frontend**

```typescript
// ✅ Check before uploading
const file = event.target.files[0];
const validTypes = ["image/jpeg", "image/png", "image/gif"];
if (!validTypes.includes(file.type)) {
  alert("Only image files allowed");
  return;
}
```

## 4. **Delete Old Images Before Upload**

```typescript
// ✅ Prevent storage bloat
const user = await prisma.user.findUnique({ where: { id: userId } });
if (user?.profileImage) {
  await storageService.deleteFile(user.profileImage, "profiles");
}
```

## 5. **Handle Upload Progress**

```typescript
// ✅ Show progress to user
const formData = new FormData();
formData.append("profileImage", file);

const xhr = new XMLHttpRequest();
xhr.upload.addEventListener("progress", (e) => {
  const percentComplete = (e.loaded / e.total) * 100;
  console.log(`Upload ${percentComplete}% complete`);
});

xhr.open("POST", "http://localhost:3000/api/files/profile-image");
xhr.setRequestHeader("Authorization", `Bearer ${token}`);
xhr.send(formData);
```

---

# 🚀 Environment Configuration

Endpoints work with these MinIO configurations:

```env
# Local Development
MINIO_ENDPOINT=minio
MINIO_PORT=9010
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=voices

# Production
MINIO_ENDPOINT=minio.yourdomain.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_BUCKET_NAME=devscout-prod
```

---

## Summary Table

```
┌─────────────────────────────────────────────────────┐
│              FILE MANAGEMENT ENDPOINTS                │
├─────────┬────────────────┬──────────────┬───────────┤
│ Method  │ Endpoint       │ Auth         │ Purpose   │
├─────────┼────────────────┼──────────────┼───────────┤
│ POST    │ /profile-image │ Required     │ Upload    │
│ GET     │ /profile-image │ Optional     │ Download  │
│ DELETE  │ /profile-image │ Required     │ Remove    │
│ POST    │ /business-logo │ Required     │ Upload    │
│ POST    │ /business-imgs │ Required     │ Upload    │
│ DELETE  │ /business-imgs │ Required     │ Remove    │
└─────────┴────────────────┴──────────────┴───────────┘
```
