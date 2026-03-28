# Teams11

**Teams11** is a service booking and business management platform that connects **customers, vendors, and staff** in a unified system.
The platform allows customers to discover businesses, book services, and manage appointments while enabling vendors to manage their businesses, staff, and bookings efficiently.

---

# System Roles

The system contains **three primary roles**:

### Customer

Customers can search for businesses, explore services, and book appointments.

### Vendor

Vendors are business owners who manage their business profiles, services, staff, and bookings.

### Staff

Staff members perform services and manage their working schedules.

---

# Authentication System

Authentication is shared across all roles.

## Create Account

Users can create an account with email verification.

Fields:

- Full Name
- Email
- Password
- Role (customer | vendor)

## Login

Users can login using:

- Email or Phone
- Password

## Forgot Password

Password recovery process includes:

1. Enter email or phone
2. Receive 6-digit OTP
3. Verify OTP
4. Create a new password

---

# Customer Module

## Customer Home Page

Features include:

### Search

Customers can search businesses by:

- Business Title

### Filter

Customers can filter businesses by:

- Category

---

## Business Listing

Each business profile includes:

- Business Title
- Business Category
- Profile Image
- Description
- Business Details
- Reviews and Ratings
- Location
- Favorite Count

---

## Services

Each business can have multiple services.

Service fields:

- Service Title
- Description
- Price
- Duration

---

# Booking System (Customer Side)

## Booking Flow

1. Customer selects a service
2. Choose date and time
3. Choose booking type

### Booking Types

- Virtual (Zoom)
- In-person

### Booking Data

- Service Title
- Price
- Duration
- Date
- Time
- Status

### Booking Status

- Pending
- Waiting
- Confirmed
- Cancelled

---

## Additional Features

### Waiting List

Customers can join a waiting list if a booking slot is unavailable.

### Cancel Booking

Customers can cancel a booking and provide a reason.

### Reschedule

Customers can reschedule bookings.

### Service Color Tag

Services can have color tags for better visual organization.

---

# Review System

After service completion, customers can leave:

- Rating
- Review Comment

---

# Customer Profile

Profile fields:

- Name
- Profile Image
- Email
- Phone
- Password

---

## Notification Settings

Users can enable or disable:

- Email Notifications
- Push Notifications
- Booking Reminders

---

## Notifications

Examples:

- Today’s appointment reminder
- Upcoming appointment notification

---

# Referral System

Each user gets a unique referral link.

Example:

teams11.com/signup?ref=ABC123

When a new vendor signs up using this link, the referral count increases.

Example:

Referrer | Joined Vendors
UserA | 3
UserB | 10

---

# Vendor Module

After vendor signup, vendors must create a business.

---

# Vendor Dashboard

### Today's Overview

- Today's Bookings
- Today's Revenue
- Active Clients

### Upcoming Appointments

Fields include:

- Client Name
- Service Name
- Scheduled Time
- Service Duration
- Assigned Staff
- Status

### Dashboard API

**GET /dashboard/vendor**

Retrieves aggregated dashboard data for vendors including:

- Business information
- Statistics (services count, staff count, total bookings, upcoming bookings)
- Recent reviews
- Upcoming bookings
- Recent notifications

**Authentication:** Required (Vendor role)

**Response:**

```json
{
  "business": {
    "id": "string",
    "name": "string",
    "description": "string",
    "logo": "string",
    "location": "string",
    "workingDays": "json"
  },
  "stats": {
    "servicesCount": "number",
    "staffCount": "number",
    "totalBookings": "number",
    "upcomingBookingsCount": "number",
    "reviewsCount": "number"
  },
  "upcomingBookings": [...],
  "recentReviews": [...],
  "notifications": [...]
}
```

---

# Business Profile Management

Vendors can create, update, and delete business profiles.

Fields:

- Logo
- Shop Images
- Service Name
- Location
- Description
- Service Price
- Duration
- Working Days
- Staff

---

# Staff Management

Vendors can:

- Add Staff
- Edit Staff
- Delete Staff
- Assign Services

Staff fields:

- Name
- Email
- Phone
- Role
- Working Days
- Specialties
- Password
- Business Name

---

# Booking Management (Vendor)

Vendors can view booking requests from customers.

Booking statuses:

- Pending
- Waiting
- Confirmed
- Cancelled
- History

Vendor actions:

- Accept booking
- Reject booking
- Assign staff

---

# Guest Customer Feature

Vendors can manually add a customer.

Fields:

- Name
- Image
- Email
- Phone (optional)
- Address

---

# Service Categories

The system supports three booking types.

## Service

Standard service booking.

Fields:

- Title
- Duration
- Staff
- Schedule
- Date
- Guests
- Location

---

## Event

Special event booking such as:

- Workshops
- Special Offer Days

Fields similar to service bookings.

---

## Class

Group-based training or coaching.

Fields include:

- Title
- Duration
- Theme Color
- Date
- Time Range
- Price
- Available Seats
- Location (online or offline)

---

# Staff Dashboard

## Staff Overview

Displays:

- Today's Customers
- Active Customers

Fields include:

- Customer Name
- Customer Image
- Service
- Time

---

# Staff Profile

Fields:

- Name
- Image
- Email
- Phone
- Specialties
- Working Hours
- Working Days

---

# Notification System

Notifications are supported for both customers and staff.

Types:

- Email Notifications
- Push Notifications
- Booking Reminders

---

# Subscription Plans

The system supports multiple subscription plans.

| Feature Category | Feature Name         | Starter | Duo | Small Team | Enterprise |
| ---------------- | -------------------- | ------- | --- | ---------- | ---------- |
| Capacity         | Max Staff            | 1       | 2   | 5          | 10+        |
| Core             | Booking Types        | Yes     | Yes | Yes        | Yes        |
| Growth           | Referral System      | Yes     | Yes | Yes        | Yes        |
| Advanced         | Waiting List Feature | No      | Yes | Yes        | Yes        |

---

---

# Technology Stack

Frontend

- flutter

Backend

- NestJS
- REST API

Database

- PostgreSQL

Authentication

- JWT
- OTP Email Verification

Infrastructure

- Docker
- Cloud Hosting

---

# Vision

Teams11 aims to become a **complete service booking ecosystem** that helps businesses manage appointments, staff, and customers efficiently while giving customers a seamless booking experience.

I completed:

1. AuthModule
2. BusinessModule
3. StaffModule
4. ServiceModule
5. BookingModule
6. CategoryModule
7. ReviewModule
