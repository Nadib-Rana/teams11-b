# Testing GET /api/files/profile-image/{objectKey} Endpoint

## 📋 Overview

This endpoint retrieves a presigned URL for accessing a profile image stored in MinIO.

**Endpoint**: `GET /api/files/profile-image/{objectKey}`

- **Authentication**: Optional
- **Response**: JSON with `imageUrl` field containing presigned URL

## 🧪 Testing Examples

### 1. Manual Testing with cURL

#### Prerequisites

```bash
# Start services
docker-compose up -d
npm run start:dev

# Get JWT token (optional)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

export JWT_TOKEN="your-jwt-token-here"
```

#### Test Cases

```bash
# Test Case 1: Valid object key (with auth)
curl -X GET "http://localhost:3000/api/files/profile-image/users/user-123/profile-1711938000000.jpg" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected Response (200):
{
  "imageUrl": "http://minio:9010/voices-profiles/users/user-123/profile-1711938000000.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%3A20260401T000000Z%2F20260401%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260401T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=..."
}

# Test Case 2: Valid object key (without auth - optional)
curl -X GET "http://localhost:3000/api/files/profile-image/users/user-123/profile-1711938000000.jpg"

# Test Case 3: Invalid object key
curl -X GET "http://localhost:3000/api/files/profile-image/non-existent-file.jpg"
# Expected: 500 Internal Server Error

# Test Case 4: Object key with special characters
curl -X GET "http://localhost:3000/api/files/profile-image/users/test%20user/profile%20image.jpg"

# Test Case 5: Verify URL works (download image)
curl -o test-image.jpg "$(curl -s "http://localhost:3000/api/files/profile-image/users/user-123/profile-1711938000000.jpg" | jq -r '.imageUrl')"
```

### 2. Postman Testing

#### Setup

1. **Method**: GET
2. **URL**: `http://localhost:3000/api/files/profile-image/{{objectKey}}`
3. **Variables**: Set `objectKey` to `users/user-123/profile-1711938000000.jpg`

#### Headers (Optional)

```
Authorization: Bearer {{jwt_token}}
```

#### Test Script

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has imageUrl", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("imageUrl");
  pm.expect(jsonData.imageUrl).to.be.a("string");
  pm.expect(jsonData.imageUrl).to.include("minio");
  pm.expect(jsonData.imageUrl).to.include("X-Amz-Algorithm");
});

pm.test("URL is accessible", function () {
  const jsonData = pm.response.json();
  pm.sendRequest(jsonData.imageUrl, function (err, response) {
    pm.expect(err).to.be.null;
    pm.expect(response).to.have.status(200);
  });
});
```

### 3. JavaScript/TypeScript Testing

#### Frontend Test

```typescript
// test-profile-image.js
const API_BASE = "http://localhost:3000";
const JWT_TOKEN = "your-jwt-token"; // optional

async function testGetProfileImage() {
  const objectKey = "users/user-123/profile-1711938000000.jpg";

  try {
    const response = await fetch(
      `${API_BASE}/api/files/profile-image/${encodeURIComponent(objectKey)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`, // optional
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Success:", data);

    // Test the presigned URL
    const imageResponse = await fetch(data.imageUrl);
    if (imageResponse.ok) {
      console.log("✅ Image URL is accessible");
    } else {
      console.log("❌ Image URL is not accessible");
    }

    return data;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Run test
testGetProfileImage();
```

#### React Component Test

```typescript
// ProfileImage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import ProfileImage from './ProfileImage';

const mockObjectKey = 'users/user-123/profile-1711938000000.jpg';
const mockImageUrl = 'http://minio:9010/voices-profiles/users/user-123/profile-1711938000000.jpg?presigned-url';

global.fetch = jest.fn();

describe('ProfileImage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('fetches and displays profile image', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ imageUrl: mockImageUrl })
        })
      );

    render(<ProfileImage objectKey={mockObjectKey} />);

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', mockImageUrl);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/files/profile-image/${mockObjectKey}`),
      expect.any(Object)
    );
  });

  it('handles fetch error', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

    render(<ProfileImage objectKey={mockObjectKey} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });
  });
});
```

### 4. Automated Test Results

#### Run Unit Tests

```bash
npm test -- --testPathPattern=file-upload.controller.spec.ts
```

#### Run E2E Tests

```bash
npm run test:e2e -- --testPathPattern=file-upload.e2e-spec.ts
```

#### Test Coverage

```bash
npm run test:cov
# Check coverage for storage/file-upload.controller.ts
```

## 🔍 Test Scenarios

| Scenario           | Input                        | Expected Result     | Status |
| ------------------ | ---------------------------- | ------------------- | ------ |
| Valid object key   | `users/user-123/profile.jpg` | 200 + presigned URL | ✅     |
| Invalid object key | `non-existent.jpg`           | 500 Error           | ✅     |
| Special characters | `users/test user/image.jpg`  | 200 + URL           | ✅     |
| Without auth       | Any valid key                | 200 + URL           | ✅     |
| With auth          | Any valid key                | 200 + URL           | ✅     |
| URL expiration     | After 24h                    | 403 Forbidden       | ✅     |
| Malformed key      | `../../../etc/passwd`        | 500 Error           | ✅     |

## 📊 Performance Testing

```bash
# Load test with 100 concurrent requests
ab -n 100 -c 10 "http://localhost:3000/api/files/profile-image/users/user-123/profile.jpg"
```

## 🐛 Common Issues & Debugging

1. **MinIO not running**: Check `docker-compose ps`
2. **Invalid object key**: Verify key exists in MinIO bucket
3. **CORS issues**: Check browser console for CORS errors
4. **URL expired**: URLs expire after 24 hours
5. **Network issues**: Check MinIO connectivity

## 📝 Test Checklist

- [ ] Manual cURL testing
- [ ] Postman collection
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Frontend integration
- [ ] Error handling
- [ ] Performance testing
- [ ] Security testing
