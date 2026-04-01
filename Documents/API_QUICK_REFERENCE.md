# File Management API - Quick Reference Card

## 🎯 Base URL

```
http://localhost:3000/api/files
```

---

## 1️⃣ USER PROFILE IMAGE

### Upload Profile

```bash
POST /profile-image
Content-Type: multipart/form-data
Authorization: Bearer {token}

Field: "profileImage" (file, max 5MB, image only)

Response (200):
{
  "success": true,
  "objectKey": "users/uuid/profile-1711938000000.jpg",
  "imageUrl": "http://minio:9010/...",
  "message": "Profile image uploaded successfully"
}
```

### Get Profile Image URL

```bash
GET /profile-image/{objectKey}
Authorization: Bearer {token}

Response (200):
{
  "imageUrl": "http://minio:9010/..."
}
```

### Delete Profile Image

```bash
DELETE /profile-image
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Profile image deleted successfully"
}
```

---

## 2️⃣ BUSINESS LOGO

### Upload Logo

```bash
POST /business-logo/{businessId}
Content-Type: multipart/form-data
Authorization: Bearer {token}

Field: "logo" (file, max 5MB, image only)

Response (200):
{
  "success": true,
  "objectKey": "businesses/uuid/logo-1711938000000.jpg",
  "imageUrl": "http://minio:9010/...",
  "message": "Business logo uploaded successfully"
}
```

---

## 3️⃣ BUSINESS IMAGES (Gallery)

### Upload Image

```bash
POST /business-images/{businessId}
Content-Type: multipart/form-data
Authorization: Bearer {token}

Field: "images" (file, max 5MB, image only)

Response (200):
{
  "success": true,
  "imageId": "uuid",
  "objectKey": "businesses/uuid/images/1711938000000-photo.jpg",
  "message": "Business image uploaded successfully"
}
```

### Delete Image

```bash
DELETE /business-images/{imageId}
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## 📋 Parameter Reference

| Endpoint              | Parameter    | Type   | Required | Example               |
| --------------------- | ------------ | ------ | -------- | --------------------- |
| /profile-image        | profileImage | File   | ✅       | image.jpg             |
| /profile-image/{key}  | objectKey    | String | ✅       | users/123/profile.jpg |
| /business-logo/{id}   | businessId   | String | ✅       | business-456          |
| /business-logo/{id}   | logo         | File   | ✅       | logo.png              |
| /business-images/{id} | businessId   | String | ✅       | business-456          |
| /business-images/{id} | images       | File   | ✅       | photo.jpg             |
| /business-images/{id} | imageId      | String | ✅       | image-uuid            |

---

## 🔑 HTTP Headers Required

```
Authorization: Bearer {JWT_TOKEN}
```

---

## 📦 File Constraints

```
Max Size: 5 MB
Formats: jpg, jpeg, png, gif
Type Validation: MIME type & extension
```

---

## ✅ Success Response Format

```json
{
  "success": true,
  "objectKey": "string",
  "imageUrl": "string (optional)",
  "imageId": "string (optional)",
  "message": "string"
}
```

---

## ❌ Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest|Unauthorized|NotFound"
}
```

---

## 🚨 Common Errors

| Error                        | Status | Fix                       |
| ---------------------------- | ------ | ------------------------- |
| Only image files are allowed | 400    | Use jpg/png/gif           |
| No file provided             | 400    | Include file in form data |
| File exceeds 5MB limit       | 413    | Reduce file size          |
| Unauthorized                 | 401    | Add valid JWT token       |
| Image not found              | 404    | Verify imageId exists     |

---

## 💻 Quick JavaScript Example

```javascript
// Upload profile image
const uploadProfile = async (file, token) => {
  const fd = new FormData();
  fd.append("profileImage", file);

  const res = await fetch("http://localhost:3000/api/files/profile-image", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  return res.json();
};

// Delete profile image
const deleteProfile = async (token) => {
  const res = await fetch("http://localhost:3000/api/files/profile-image", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// Get image URL
const getImageUrl = async (objectKey, token) => {
  const res = await fetch(
    `http://localhost:3000/api/files/profile-image/${objectKey}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return (await res.json()).imageUrl;
};
```

---

## 📱 React Component Example

```jsx
import { useState } from "react";

function ProfileImageUpload({ token }) {
  const [imageUrl, setImageUrl] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("profileImage", file);

    try {
      const res = await fetch("http://localhost:3000/api/files/profile-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      setImageUrl(data.imageUrl);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} accept="image/*" />
      {imageUrl && <img src={imageUrl} alt="Profile" />}
    </div>
  );
}

export default ProfileImageUpload;
```

---

## 🔄 Complete Upload-Display Flow

```
1. User selects file
   ↓
2. POST /profile-image (upload)
   ↓ (get objectKey)
   ↓
3. Save objectKey to database
   ↓
4. GET /profile-image/{objectKey} (when needed)
   ↓ (get imageUrl)
   ↓
5. Display image in <img src={imageUrl} />
```

---

## 🗑️ Delete Flow

```
1. User clicks delete
   ↓
2. DELETE /profile-image
   ↓ (removes from MinIO & database)
   ↓
3. Update UI (remove image display)
```

---

## 📊 Data Lifecycle in Database

```
User Table:
┌────────────────────────────────┐
│ id    | fullName | profileImage │
├───────┼──────────┼──────────────┤
│ uuid1 | John     │ object_key   │ ← Store THIS (not URL)
└────────────────────────────────┘

Example objectKey:
users/550e8400-e29b-41d4-a716-446655440000/profile-1711938000000.jpg
```

---

## ⚙️ Configuration

```env
# MinIO settings in .env
MINIO_ENDPOINT=minio (or localhost for production)
MINIO_PORT=9010 (or 9000 for production)
MINIO_BUCKET_NAME=voices (base bucket name)

# Full bucket names created:
- voices-profiles
- voices-businesses
- voices-categories
- voices-reviews
- voices-documents
```

---

## 🎯 Key Points to Remember

✅ **Always store objectKey in DB** (not the URL)
✅ **Generate URLs on-demand** (they expire in 24h)
✅ **Delete old images before uploading new ones**
✅ **Include Authorization header** for protected endpoints
✅ **Validate file type before uploading**
✅ **Handle errors gracefully** in frontend
✅ **Use multipart/form-data** for file uploads

---

## 📖 Full Documentation

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for detailed examples and use cases.
