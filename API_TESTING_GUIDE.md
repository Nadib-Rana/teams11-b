# File Management API - Testing & Implementation Guide

## 🧪 Testing the API Endpoints

### Prerequisites

1. Start MinIO: `docker-compose up -d`
2. Start Application: `bun run start:dev`
3. Get JWT Token: Login first to get token
4. Have test images ready

---

## 📋 Step-by-Step Testing

### Step 1: Get JWT Token

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "customer"
  }
}

# Save this token for next requests
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔧 Test Case 1: Upload Profile Image

### Using cURL

```bash
# Upload profile image
curl -X POST http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "profileImage=@test-profile.jpg"

# Expected Response (200):
{
  "success": true,
  "objectKey": "users/550e8400-e29b-41d4-a716-446655440000/profile-1711938000000.jpg",
  "imageUrl": "http://minio:9010/voices-profiles/users/550e8400-e29b-41d4-a716-446655440000/profile-1711938000000.jpg?X-Amz-Algorithm=...",
  "message": "Profile image uploaded successfully"
}

# Save the objectKey for later tests
export OBJECT_KEY="users/550e8400-e29b-41d4-a716-446655440000/profile-1711938000000.jpg"
```

### Using Postman

1. **Create New Request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/files/profile-image`

2. **Set Headers**
   - Authorization: Bearer (select Auth tab instead)

3. **Set Auth**
   - Type: Bearer Token
   - Token: (paste your JWT token)

4. **Set Body**
   - Type: form-data
   - Key: `profileImage`
   - Value: Select file (test-profile.jpg)

5. **Click Send**
   - Should return 200 with success: true

---

## 🔧 Test Case 2: Get Profile Image URL

### Using cURL

```bash
# Get presigned URL
curl -X GET "http://localhost:3000/api/files/profile-image/$OBJECT_KEY" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected Response (200):
{
  "imageUrl": "http://minio:9010/voices-profiles/users/550e8400-e29b-41d4-a716-446655440000/profile-1711938000000.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin...",
  "message": "Presigned URL generated successfully"
}

# Test the URL in browser - image should display
curl -o downloaded-image.jpg "http://minio:9010/voices-profiles/users/550e8400-e29b-41d4-a716-446655440000/profile-1711938000000.jpg?X-Amz-Algorithm=..."
```

### Using Browser

```javascript
// In browser console
const token = localStorage.getItem("token");
const objectKey =
  "users/550e8400-e29b-41d4-a716-446655440000/profile-1711938000000.jpg";

fetch(`http://localhost:3000/api/files/profile-image/${objectKey}`, {
  headers: { Authorization: `Bearer ${token}` },
})
  .then((r) => r.json())
  .then((data) => {
    console.log("Image URL:", data.imageUrl);
    // Display image
    document.getElementById("profile").src = data.imageUrl;
  });
```

---

## 🔧 Test Case 3: Delete Profile Image

### Using cURL

```bash
# Delete profile image
curl -X DELETE http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response (200):
{
  "success": true,
  "message": "Profile image deleted successfully"
}

# Verify deletion by trying to get the image
curl -X GET "http://localhost:3000/api/files/profile-image/$OBJECT_KEY" \
  -H "Authorization: Bearer $JWT_TOKEN"
# Should fail with 404 or indicate image doesn't exist
```

---

## 🔧 Test Case 4: Upload Business Logo

### Using cURL

```bash
# First, create or get a business ID
# Assume businessId = "business-456"

curl -X POST http://localhost:3000/api/files/business-logo/business-456 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "logo=@test-logo.png"

# Expected Response (200):
{
  "success": true,
  "objectKey": "businesses/business-456/logo-1711938000000.jpg",
  "imageUrl": "http://minio:9010/voices-businesses/businesses/business-456/logo-1711938000000.jpg?X-Amz...",
  "message": "Business logo uploaded successfully"
}
```

---

## 🔧 Test Case 5: Upload Business Images (Gallery)

### Using cURL - Single Image

```bash
curl -X POST http://localhost:3000/api/files/business-images/business-456 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "images=@gallery-photo-1.jpg"

# Expected Response (200):
{
  "success": true,
  "imageId": "550e8400-e29b-41d4-a716-446655440001",
  "objectKey": "businesses/business-456/images/1711938000000-photo.jpg",
  "message": "Business image uploaded successfully"
}

# Save imageId for later
export IMAGE_ID="550e8400-e29b-41d4-a716-446655440001"
```

### Using cURL - Multiple Images (Loop)

```bash
#!/bin/bash

BUSINESS_ID="business-456"
JWT_TOKEN="your_jwt_token"

for image in gallery/*.jpg; do
  echo "Uploading $image..."
  curl -X POST "http://localhost:3000/api/files/business-images/$BUSINESS_ID" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -F "images=@$image"
  echo ""
done
```

### Using Node.js/JavaScript

```javascript
// Node.js - Upload multiple images
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const axios = require("axios");

const uploadImages = async (businessId, imagesDir, token) => {
  const files = fs
    .readdirSync(imagesDir)
    .filter((f) => /\.(jpg|jpeg|png|gif)$/i.test(f));

  for (const file of files) {
    const form = new FormData();
    form.append("images", fs.createReadStream(path.join(imagesDir, file)));

    try {
      const response = await axios.post(
        `http://localhost:3000/api/files/business-images/${businessId}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log(`✓ Uploaded ${file}:`, response.data.imageId);
    } catch (error) {
      console.error(`✗ Failed to upload ${file}:`, error.message);
    }
  }
};

// Usage
uploadImages("business-456", "./images", JWT_TOKEN);
```

---

## 🔧 Test Case 6: Delete Business Image

### Using cURL

```bash
curl -X DELETE "http://localhost:3000/api/files/business-images/$IMAGE_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected Response (200):
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## ❌ Error Testing

### Test 1: Missing File

```bash
curl -X POST http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer $JWT_TOKEN"
  # No -F field

# Expected Response (400):
{
  "statusCode": 400,
  "message": "No file provided",
  "error": "Bad Request"
}
```

### Test 2: Invalid File Type

```bash
# Try uploading PDF instead of image
curl -X POST http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "profileImage=@document.pdf"

# Expected Response (400):
{
  "statusCode": 400,
  "message": "Only image files are allowed",
  "error": "Bad Request"
}
```

### Test 3: File Too Large

```bash
# Try uploading file > 5MB
curl -X POST http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "profileImage=@large-image-10mb.jpg"

# Expected Response (413):
{
  "statusCode": 413,
  "message": "Payload Too Large"
}
```

### Test 4: Missing Authorization

```bash
curl -X POST http://localhost:3000/api/files/profile-image \
  -F "profileImage=@test.jpg"
  # No Authorization header

# Expected Response (401):
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Test 5: Invalid JWT Token

```bash
curl -X POST http://localhost:3000/api/files/profile-image \
  -H "Authorization: Bearer invalid_token" \
  -F "profileImage=@test.jpg"

# Expected Response (401):
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

---

## 📊 Integration Testing Checklist

- [ ] Can upload profile image successfully
- [ ] Can retrieve profile image URL
- [ ] Can delete profile image
- [ ] Can upload business logo
- [ ] Can upload business gallery images
- [ ] Can delete business images
- [ ] Proper error handling for missing files
- [ ] Proper error handling for invalid file types
- [ ] Proper error handling for large files
- [ ] Proper error handling for missing auth
- [ ] Proper error handling for invalid auth
- [ ] Object keys stored in database correctly
- [ ] Old images deleted when uploading new
- [ ] Images accessible via presigned URLs
- [ ] URLs expire properly (24 hours)

---

## 🔍 Debugging Tips

### Check MinIO Buckets

```bash
# View MinIO console
# http://localhost:9001
# Username: minioadmin
# Password: minioadmin123

# Or use MinIO CLI
docker exec minio_teams11_container mc ls minio/voices-profiles/
```

### Check Database

```bash
# View stored objectKeys
docker exec postgres_teams11_container psql -U nest_js -d teams11_nest_js -c \
  "SELECT id, profile_image FROM users WHERE profile_image IS NOT NULL;"
```

### View Application Logs

```bash
# Check for MinIO connection errors
bun run start:dev

# Look for messages like:
# "✓ Created MinIO bucket: voices-profiles"
# or
# "✗ Failed to create/check bucket: ..."
```

### Test MinIO Connection

```bash
# Check if MinIO is accessible
curl http://localhost:9010/minio/health/live

# Should return 200 OK
```

---

## 📱 Frontend Integration Examples

### React Hook for Image Upload

```typescript
// hooks/useImageUpload.ts
import { useState } from "react";

function useImageUpload(token: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objectKey, setObjectKey] = useState<string | null>(null);

  const uploadProfileImage = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await fetch(
        "http://localhost:3000/api/files/profile-image",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setObjectKey(data.objectKey);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { uploadProfileImage, loading, error, objectKey };
}

export default useImageUpload;
```

### React Component Using Hook

```typescript
// components/ProfileImageUpload.tsx
import { useState } from 'react';
import useImageUpload from '../hooks/useImageUpload';

function ProfileImageUpload({ token }: { token: string }) {
  const { uploadProfileImage, loading, error } = useImageUpload(token);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    try {
      const result = await uploadProfileImage(file);
      console.log('Uploaded:', result.objectKey);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div className="profile-upload">
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={loading}
      />
      {loading && <p>Uploading...</p>}
      {error && <p className="error">{error}</p>}
      {preview && <img src={preview} alt="Preview" />}
    </div>
  );
}

export default ProfileImageUpload;
```

---

## 📝 Postman Collection JSON

Save as `devscout-files-api.postman_collection.json`:

```json
{
  "info": {
    "name": "DevScout File Management API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Profile Image",
      "item": [
        {
          "name": "Upload",
          "request": {
            "method": "POST",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "profileImage", "type": "file", "src": "test.jpg" }
              ]
            },
            "url": { "raw": "http://localhost:3000/api/files/profile-image" }
          }
        },
        {
          "name": "Get URL",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "http://localhost:3000/api/files/profile-image/{{objectKey}}"
            }
          }
        },
        {
          "name": "Delete",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "http://localhost:3000/api/files/profile-image" }
          }
        }
      ]
    }
  ],
  "variable": [
    { "key": "token", "value": "" },
    { "key": "objectKey", "value": "" }
  ]
}
```

---

## 🎯 Summary

All endpoints are tested and ready to use. See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete documentation.
