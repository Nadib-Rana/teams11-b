# Notification System API Documentation

Complete API reference for Teams11 Notification System with multi-channel support (Email, SMS, Push Notifications).

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Notification Endpoints](#notification-endpoints)
5. [Device Management Endpoints](#device-management-endpoints)
6. [Notification Settings](#notification-settings)
7. [Templates Management](#templates-management)
8. [Response Models](#response-models)
9. [Error Codes](#error-codes)
10. [Examples](#examples)

---

## Overview

The Notification System provides multi-channel delivery of notifications:

- **Email**: Via Nodemailer with Handlebars templates
- **SMS**: Via Twilio
- **Push Notifications**: Via Firebase Cloud Messaging (FCM)

All endpoints require authentication via JWT token in the Authorization header.

### Notification Channels

```
- email: Standard email notifications
- sms: SMS text messages
- push: Firebase push notifications for mobile apps
```

### Notification Types

```
- booking_confirmation: When a booking is created
- booking_reminder: 24h and 1h reminders before appointment
- cancellation: When a booking is cancelled
- update: General updates about bookings
```

---

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The token should contain the `userId` which is extracted automatically for most endpoints.

---

## Base URL

```
http://localhost:3000/notifications
```

All endpoint paths shown below are relative to this base URL.

---

## Notification Endpoints

### 1. List Notifications

Retrieve all notifications for the authenticated user.

**Endpoint**: `GET /`

**Authentication**: Required ✓

**Response**:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "bookingId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Booking Confirmed",
    "message": "Your haircut appointment is confirmed for tomorrow at 2:00 PM",
    "type": "booking_confirmation",
    "channel": "push",
    "deliveryStatus": "sent",
    "sentAt": "2024-04-05T10:30:00Z",
    "retryCount": 0,
    "isRead": false,
    "createdAt": "2024-04-05T10:30:00Z"
  }
]
```

**Status Codes**:

- `200 OK` - Successfully retrieved notifications
- `401 Unauthorized` - Missing or invalid token

---

### 2. Mark Notification as Read

Mark a specific notification as read.

**Endpoint**: `PATCH /:id/read`

**Parameters**:

- `id` (path parameter): Notification ID (UUID)

**Authentication**: Required ✓

**Request Body**: None

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Booking Confirmed",
  "message": "Your haircut appointment is confirmed",
  "isRead": true,
  "createdAt": "2024-04-05T10:30:00Z"
}
```

**Status Codes**:

- `200 OK` - Notification marked as read
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Notification not found

---

### 3. Send Booking Reminder

Manually send a reminder notification for a specific booking to the customer.

**Endpoint**: `POST /booking-reminder`

**Authentication**: Required ✓

**Request Body**:

```json
{
  "bookingId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "bookingId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Booking Reminder",
  "message": "Reminder: You have a haircut appointment tomorrow at 2:00 PM",
  "type": "booking_reminder",
  "channel": "push",
  "deliveryStatus": "sent",
  "createdAt": "2024-04-05T10:30:00Z"
}
```

**Status Codes**:

- `200 OK` - Reminder sent successfully
- `400 Bad Request` - Invalid booking ID
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Booking not found

---

### 4. Get Notification Analytics

Get statistics and analytics for user's notifications.

**Endpoint**: `GET /analytics`

**Authentication**: Required ✓

**Response**:

```json
{
  "totalNotifications": 42,
  "readNotifications": 38,
  "unreadNotifications": 4,
  "byChannel": {
    "email": 15,
    "sms": 12,
    "push": 15
  },
  "byType": {
    "booking_confirmation": 10,
    "booking_reminder": 20,
    "cancellation": 5,
    "update": 7
  },
  "deliveryStatus": {
    "sent": 40,
    "pending": 1,
    "failed": 1
  }
}
```

**Status Codes**:

- `200 OK` - Analytics retrieved successfully
- `401 Unauthorized` - Missing or invalid token

---

## Device Management Endpoints

### 5. Register Device for Push Notifications

Register a mobile device with Firebase Cloud Messaging token.

**Endpoint**: `POST /devices`

**Authentication**: Required ✓

**Request Body**:

```json
{
  "deviceId": "device_identifier_12345",
  "fcmToken": "dxM:APbPEFgVp7x-aMDPw4jK9cH8z...",
  "deviceType": "android",
  "deviceName": "Samsung Galaxy S21"
}
```

**Parameters**:

- `deviceId` (required): Unique device identifier (string)
- `fcmToken` (required): Firebase Cloud Messaging token (string)
- `deviceType` (optional): Device type - "android", "ios", or "web"
- `deviceName` (optional): Human-readable device name

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "deviceId": "device_identifier_12345",
  "fcmToken": "dxM:APbPEFgVp7x-aMDPw4jK9cH8z...",
  "deviceType": "android",
  "deviceName": "Samsung Galaxy S21",
  "isActive": true,
  "lastSeenAt": "2024-04-05T10:30:00Z",
  "createdAt": "2024-04-05T10:30:00Z",
  "updatedAt": "2024-04-05T10:30:00Z"
}
```

**Status Codes**:

- `201 Created` - Device registered successfully
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Missing or invalid token

---

### 6. Update FCM Token

Update the Firebase Cloud Messaging token for a registered device (called when FCM token refreshes).

**Endpoint**: `PATCH /devices/:deviceId`

**Parameters**:

- `deviceId` (path parameter): Device identifier (string)

**Authentication**: Required ✓

**Request Body**:

```json
{
  "fcmToken": "new_fcm_token_dxM:APbPEFgVp7x-aMDPw4jK9..."
}
```

**Response**:

```json
{
  "success": true
}
```

**Status Codes**:

- `200 OK` - FCM token updated successfully
- `400 Bad Request` - Missing fcmToken
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Device not found

---

### 7. Unregister Device

Unregister a device from push notifications (e.g., when user logs out or uninstalls app).

**Endpoint**: `DELETE /devices/:deviceId`

**Parameters**:

- `deviceId` (path parameter): Device identifier (string)

**Authentication**: Required ✓

**Request Body**: None

**Response**:

```json
{
  "success": true
}
```

**Status Codes**:

- `200 OK` - Device unregistered successfully
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Device not found

---

### 8. Get User Devices

Retrieve all active devices registered for push notifications.

**Endpoint**: `GET /devices`

**Authentication**: Required ✓

**Response**:

```json
[
  {
    "deviceId": "device_identifier_12345",
    "deviceType": "android",
    "deviceName": "Samsung Galaxy S21",
    "lastSeenAt": "2024-04-05T10:30:00Z",
    "createdAt": "2024-04-05T10:30:00Z"
  },
  {
    "deviceId": "device_identifier_67890",
    "deviceType": "ios",
    "deviceName": "iPhone 14",
    "lastSeenAt": "2024-04-05T09:15:00Z",
    "createdAt": "2024-04-04T15:20:00Z"
  }
]
```

**Status Codes**:

- `200 OK` - Devices retrieved successfully
- `401 Unauthorized` - Missing or invalid token

---

## Notification Settings

### 9. Get Notification Settings

Retrieve the user's notification preferences.

**Endpoint**: `GET /settings`

**Authentication**: Required ✓

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "emailNotification": true,
  "smsNotification": true,
  "pushNotification": true,
  "bookingReminders": true,
  "reminder24h": true,
  "reminder1h": true
}
```

**Status Codes**:

- `200 OK` - Settings retrieved successfully
- `401 Unauthorized` - Missing or invalid token

---

### 10. Update Notification Settings

Update user's notification preferences. All fields are optional.

**Endpoint**: `PATCH /settings`

**Authentication**: Required ✓

**Request Body** (all optional):

```json
{
  "emailNotification": false,
  "smsNotification": true,
  "pushNotification": true,
  "bookingReminders": true,
  "reminder24h": true,
  "reminder1h": false
}
```

**Parameters**:

- `emailNotification` (optional): Enable/disable email notifications (boolean)
- `smsNotification` (optional): Enable/disable SMS notifications (boolean)
- `pushNotification` (optional): Enable/disable push notifications (boolean)
- `bookingReminders` (optional): Enable/disable booking reminders (boolean)
- `reminder24h` (optional): Enable/disable 24-hour reminders (boolean)
- `reminder1h` (optional): Enable/disable 1-hour reminders (boolean)

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "emailNotification": false,
  "smsNotification": true,
  "pushNotification": true,
  "bookingReminders": true,
  "reminder24h": true,
  "reminder1h": false
}
```

**Status Codes**:

- `200 OK` - Settings updated successfully
- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Missing or invalid token

---

## Templates Management

### 11. Get Notification Templates

Retrieve all available notification templates.

**Endpoint**: `GET /templates`

**Authentication**: Required ✓

**Response**:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "name": "booking_confirmation",
    "type": "booking_confirmation",
    "subject": "Booking Confirmed - {{serviceName}}",
    "body": "Dear {{customerName}},\n\nYour booking for {{serviceName}} has been confirmed.\n\nDetails:\n- Date: {{date}}\n- Time: {{startTime}}\n- Business: {{businessName}}\n- Staff: {{staffName}}\n\nThank you!",
    "variables": [
      "customerName",
      "serviceName",
      "date",
      "startTime",
      "businessName",
      "staffName"
    ],
    "isActive": true,
    "createdAt": "2024-04-05T10:30:00Z",
    "updatedAt": "2024-04-05T10:30:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "name": "booking_reminder_24h",
    "type": "booking_reminder",
    "subject": "Reminder: Your appointment tomorrow",
    "body": "Hi {{customerName}},\n\nThis is a reminder that you have a {{serviceName}} appointment tomorrow at {{startTime}} with {{staffName}} at {{businessName}}.\n\nWe look forward to seeing you!",
    "variables": [
      "customerName",
      "serviceName",
      "startTime",
      "staffName",
      "businessName"
    ],
    "isActive": true,
    "createdAt": "2024-04-05T10:30:00Z",
    "updatedAt": "2024-04-05T10:30:00Z"
  }
]
```

**Status Codes**:

- `200 OK` - Templates retrieved successfully
- `401 Unauthorized` - Missing or invalid token

---

### 12. Create Notification Template

Create a new notification template (Admin only).

**Endpoint**: `POST /templates`

**Authentication**: Required ✓

**Request Body**:

```json
{
  "name": "custom_notification",
  "type": "custom",
  "subject": "Custom Subject - {{variableName}}",
  "body": "Dear {{customerName}},\n\nThis is a custom notification.\n\nDetails: {{details}}",
  "variables": ["customerName", "variableName", "details"]
}
```

**Parameters**:

- `name` (required): Unique template name (string)
- `type` (required): Template type (string)
- `subject` (required): Email subject with variables (string)
- `body` (required): Email body with variables (string)
- `variables` (required): Array of variable names used in template (string[])

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "name": "custom_notification",
  "type": "custom",
  "subject": "Custom Subject - {{variableName}}",
  "body": "Dear {{customerName}},\n\nThis is a custom notification.\n\nDetails: {{details}}",
  "variables": ["customerName", "variableName", "details"],
  "isActive": true,
  "createdAt": "2024-04-05T10:30:00Z",
  "updatedAt": "2024-04-05T10:30:00Z"
}
```

**Status Codes**:

- `201 Created` - Template created successfully
- `400 Bad Request` - Missing required fields or duplicate name
- `401 Unauthorized` - Missing or invalid token

---

## Response Models

### Notification Object

```json
{
  "id": "string (UUID)",
  "userId": "string (UUID)",
  "bookingId": "string (UUID) | null",
  "title": "string",
  "message": "string",
  "type": "string",
  "channel": "email | sms | push",
  "deliveryStatus": "pending | sent | failed",
  "sentAt": "ISO 8601 timestamp | null",
  "retryCount": "integer",
  "isRead": "boolean",
  "createdAt": "ISO 8601 timestamp"
}
```

### NotificationSetting Object

```json
{
  "id": "string (UUID)",
  "userId": "string (UUID)",
  "emailNotification": "boolean",
  "smsNotification": "boolean",
  "pushNotification": "boolean",
  "bookingReminders": "boolean",
  "reminder24h": "boolean",
  "reminder1h": "boolean"
}
```

### UserDevice Object

```json
{
  "id": "string (UUID)",
  "userId": "string (UUID)",
  "deviceId": "string",
  "fcmToken": "string",
  "deviceType": "string (ios | android | web)",
  "deviceName": "string",
  "isActive": "boolean",
  "lastSeenAt": "ISO 8601 timestamp | null",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

### NotificationTemplate Object

```json
{
  "id": "string (UUID)",
  "name": "string",
  "type": "string",
  "subject": "string",
  "body": "string",
  "variables": "string[]",
  "isActive": "boolean",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

---

## Error Codes

### Common Error Responses

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Invalid request data",
  "error": "Bad Request"
}
```

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Missing or invalid authentication token",
  "error": "Unauthorized"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

#### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Examples

### Example 1: Complete Flow - Register Device and Enable Push

**Step 1: Register Device**

```bash
curl -X POST http://localhost:3000/notifications/devices \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device_abc123",
    "fcmToken": "dxM:APbPEFgVp7x-aMDPw4jK9...",
    "deviceType": "android",
    "deviceName": "Samsung Galaxy S21"
  }'
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "deviceId": "device_abc123",
  "fcmToken": "dxM:APbPEFgVp7x-aMDPw4jK9...",
  "deviceType": "android",
  "deviceName": "Samsung Galaxy S21",
  "isActive": true,
  "createdAt": "2024-04-05T10:30:00Z"
}
```

**Step 2: Enable Push Notifications**

```bash
curl -X PATCH http://localhost:3000/notifications/settings \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pushNotification": true,
    "reminder24h": true,
    "reminder1h": true
  }'
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "emailNotification": true,
  "smsNotification": true,
  "pushNotification": true,
  "bookingReminders": true,
  "reminder24h": true,
  "reminder1h": true
}
```

---

### Example 2: Handle FCM Token Refresh

When Firebase returns a new token (typically annually or after app reinstall), update it:

```bash
curl -X PATCH http://localhost:3000/notifications/devices/device_abc123 \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "new_fcm_token_dxM:APbPEFgVp7x-aMDPw4jK..."
  }'
```

**Response:**

```json
{
  "success": true
}
```

---

### Example 3: Retrieve and Mark Notifications

**Get all notifications:**

```bash
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer <jwt_token>"
```

**Mark specific notification as read:**

```bash
curl -X PATCH http://localhost:3000/notifications/550e8400-e29b-41d4-a716-446655440000/read \
  -H "Authorization: Bearer <jwt_token>"
```

---

### Example 4: Deep Linking in Push Notifications

When a push notification is sent with a booking, it includes a deep link:

```json
{
  "notification": {
    "title": "Booking Confirmed",
    "body": "Your appointment is tomorrow at 2 PM"
  },
  "data": {
    "type": "booking",
    "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "bookingId": "123e4567-e89b-12d3-a456-426614174000",
    "deepLink": "teams11://booking/123e4567-e89b-12d3-a456-426614174000",
    "date": "2024-04-06T14:00:00Z"
  }
}
```

Your mobile app should handle the deep link to navigate to the booking details screen.

---

### Example 5: Notification Template Variables

When sending notifications, variables are replaced in the template:

**Template:**

```
Subject: Your {{serviceName}} appointment is confirmed
Body: Dear {{customerName}},

Your {{serviceName}} appointment with {{staffName}} is confirmed for {{date}} at {{startTime}}.

Location: {{businessName}}
```

**Variables provided:**

```json
{
  "customerName": "John Doe",
  "serviceName": "Haircut",
  "staffName": "Sarah Smith",
  "date": "2024-04-06",
  "startTime": "14:00",
  "businessName": "Azure Salon"
}
```

**Result:**

```
Subject: Your Haircut appointment is confirmed
Body: Dear John Doe,

Your Haircut appointment with Sarah Smith is confirmed for 2024-04-06 at 14:00.

Location: Azure Salon
```

---

## Implementation Notes

### Mobile App Integration

**Firebase Setup:**

1. Initialize Firebase in your mobile app
2. Get FCM token using Firebase messaging service
3. Call `POST /notifications/devices` with the token

**Handle FCM Token Refresh:**

```javascript
onTokenRefresh() => {
  const newToken = await getNewFCMToken();
  updateFcmToken(deviceId, newToken);
}
```

**Handle Push Notification Tap:**

```javascript
onNotificationTap(notification) => {
  if (notification.data.deepLink) {
    navigateTo(notification.data.deepLink);
  }
}
```

### Testing Notifications

```bash
# Test email notification
curl -X POST http://localhost:3000/notifications/send-test-email \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# Test SMS notification
curl -X POST http://localhost:3000/notifications/send-test-sms \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890"
  }'

# Test push notification
curl -X POST http://localhost:3000/notifications/send-test-push \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device_abc123"
  }'
```

---

## Rate Limiting

- No specific rate limits are currently implemented
- Recommended: Implement rate limiting based on notification channel
- Email: 10 per hour per user
- SMS: 20 per hour per user
- Push: Unlimited (FCM handles throttling)

---

## Changelog

### Version 1.0 (April 5, 2026)

- Initial release with multi-channel notification support
- Firebase push notifications with deep linking
- Device management for mobile apps
- Notification templates system
- User notification preferences
- Booking reminder scheduling

---

## Support

For issues or questions regarding the Notification API:

1. Check the [Notification Implementation Guide](IMPLEMENTATION_GUIDE_AUDIT.md)
2. Review [Database Migration Guide](DATABASE_MIGRATION_GUIDE.md)
3. Contact the API team

---

**Last Updated**: April 5, 2026
**API Version**: 1.0
**Status**: Production Ready ✓
