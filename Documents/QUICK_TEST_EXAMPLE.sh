# Manual Testing Examples for GET /api/files/profile-image/{objectKey}

## Quick Test Script
curl -X GET 'http://localhost:3000/api/files/profile-image/users/test-user/profile-1711938000000.jpg' \
  -H 'Content-Type: application/json' \
  -w '\nStatus: %{http_code}\nTime: %{time_total}s\n'

## Expected Response:
# {"imageUrl":"http://minio:9010/voices-profiles/users/test-user/profile-1711938000000.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&..."}
# Status: 200
# Time: 0.123s
