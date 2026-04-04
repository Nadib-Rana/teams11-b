# Notification API Quick Reference

Quick lookup guide for all notification endpoints.

## Base URL

```
http://localhost:3000/notifications
```

## Authentication

All endpoints require JWT token:

```
Authorization: Bearer <jwt_token>
```

---

## Endpoints Summary

| Method | Endpoint             | Purpose                      | Auth |
| ------ | -------------------- | ---------------------------- | ---- |
| GET    | `/`                  | List all notifications       | ✓    |
| PATCH  | `/:id/read`          | Mark notification as read    | ✓    |
| POST   | `/booking-reminder`  | Send booking reminder        | ✓    |
| GET    | `/analytics`         | Get notification analytics   | ✓    |
| GET    | `/settings`          | Get notification settings    | ✓    |
| PATCH  | `/settings`          | Update notification settings | ✓    |
| GET    | `/templates`         | List notification templates  | ✓    |
| POST   | `/templates`         | Create notification template | ✓    |
| POST   | `/devices`           | Register device for push     | ✓    |
| PATCH  | `/devices/:deviceId` | Update FCM token             | ✓    |
| DELETE | `/devices/:deviceId` | Unregister device            | ✓    |
| GET    | `/devices`           | List user devices            | ✓    |

---

## Quick Examples

### Register Device for Push Notifications

```bash
POST /devices
{
  "deviceId": "device_id",
  "fcmToken": "firebase_token",
  "deviceType": "android",
  "deviceName": "Samsung Galaxy S21"
}
```

### Update FCM Token

```bash
PATCH /devices/{deviceId}
{
  "fcmToken": "new_firebase_token"
}
```

### Get Notifications

```bash
GET /
```

### Mark as Read

```bash
PATCH /{notificationId}/read
```

### Get Settings

```bash
GET /settings
```

### Update Settings

```bash
PATCH /settings
{
  "emailNotification": true,
  "pushNotification": true,
  "reminder24h": true,
  "reminder1h": false
}
```

### Send Booking Reminder

```bash
POST /booking-reminder
{
  "bookingId": "booking_id"
}
```

### Get User Devices

```bash
GET /devices
```

### Unregister Device

```bash
DELETE /devices/{deviceId}
```

### Get Analytics

```bash
GET /analytics
```

### Get Templates

```bash
GET /templates
```

### Create Template

```bash
POST /templates
{
  "name": "template_name",
  "type": "template_type",
  "subject": "Subject with {{variables}}",
  "body": "Body content with {{variables}}",
  "variables": ["variable1", "variable2"]
}
```

---

## Common Response Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | OK - Success                         |
| 201  | Created - Resource created           |
| 400  | Bad Request - Invalid data           |
| 401  | Unauthorized - Missing/invalid token |
| 404  | Not Found - Resource not found       |
| 500  | Server Error                         |

---

## Deep Linking

Push notifications include deep links for navigation:

```
teams11://booking/{bookingId}
teams11://profile
teams11://messages
```

---

## Device Types

- `android` - Android devices
- `ios` - Apple iOS devices
- `web` - Web browsers

---

## Notification Channels

- `email` - Email notifications
- `sms` - SMS text messages
- `push` - Firebase push notifications

---

## Notification Types

- `booking_confirmation` - Booking confirmed
- `booking_reminder` - Appointment reminder
- `cancellation` - Booking cancelled
- `update` - General updates

---

## Delivery Status

- `pending` - Waiting to be sent
- `sent` - Successfully sent
- `failed` - Failed to deliver

---

## Settings Flags

| Flag                | Purpose                    | Default |
| ------------------- | -------------------------- | ------- |
| `emailNotification` | Enable email notifications | true    |
| `smsNotification`   | Enable SMS notifications   | true    |
| `pushNotification`  | Enable push notifications  | true    |
| `bookingReminders`  | Enable booking reminders   | true    |
| `reminder24h`       | Enable 24-hour reminder    | true    |
| `reminder1h`        | Enable 1-hour reminder     | true    |

---

## Required Fields by Endpoint

### Register Device

- `deviceId` (string) - Required
- `fcmToken` (string) - Required
- `deviceType` (string) - Optional
- `deviceName` (string) - Optional

### Update FCM Token

- `fcmToken` (string) - Required

### Send Booking Reminder

- `bookingId` (string, UUID) - Required

### Update Settings

- All fields optional
- At least one field recommended

### Create Template

- `name` (string, unique) - Required
- `type` (string) - Required
- `subject` (string) - Required
- `body` (string) - Required
- `variables` (array) - Required (non-empty)

---

## Variable Substitution

Templates support variable substitution with `{{variableName}}` syntax:

```
Dear {{customerName}},

Your {{serviceName}} appointment is confirmed for {{date}} at {{startTime}}.

Thank you!
```

Available variables depend on context:

- `customerName` - Customer full name
- `serviceName` - Service title
- `businessName` - Business name
- `staffName` - Staff member name
- `date` - Appointment date
- `startTime` - Appointment start time
- `bookingId` - Booking identifier

---

## Mobile App Integration Checklist

- [ ] Initialize Firebase Cloud Messaging
- [ ] Get FCM token on app startup
- [ ] Register device with `POST /devices`
- [ ] Handle FCM token refresh with `PATCH /devices/{deviceId}`
- [ ] Set up push notification tap handler
- [ ] Implement deep link navigation
- [ ] Handle notification preferences in settings
- [ ] Update notification read status
- [ ] Fetch notification list on app launch

---

## Error Responses

### Invalid Request

```json
{
  "statusCode": 400,
  "message": "Device not found",
  "error": "Bad Request"
}
```

### Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized - Missing token",
  "error": "Unauthorized"
}
```

### Not Found

```json
{
  "statusCode": 404,
  "message": "Notification not found",
  "error": "Not Found"
}
```

---

**Last Updated**: April 5, 2026
