// src/dashboard/dashboard.service.ts
import { Injectable } from "@nestjs/common";
import { BusinessService } from "../business/business.service";
import { BookingService } from "../booking/booking.service";
import { ServiceService } from "../service/service.service";
import { ReviewService } from "../review/review.service";
import { StaffService } from "../staff/staff.service";
import { NotificationService } from "../notification/notification.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly businessService: BusinessService,
    private readonly bookingService: BookingService,
    private readonly serviceService: ServiceService,
    private readonly reviewService: ReviewService,
    private readonly staffService: StaffService,
    private readonly notificationService: NotificationService,
  ) {}

  async getVendorDashboard(vendorId: string) {
    // Get vendor's businesses
    const businesses = await this.businessService.findByVendor(vendorId);

    if (!businesses || businesses.length === 0) {
      return {
        message: "No businesses found for this vendor",
        data: null,
      };
    }

    // For simplicity, assume one business per vendor, or take the first one
    const business = businesses[0];
    const businessId = business.id;

    // Get services count
    const services = await this.serviceService.findAll(businessId);
    const servicesCount = services.length;

    // Get staff count
    const staff = await this.staffService.findAll(businessId);
    const staffCount = staff.length;

    // Get total bookings
    const allBookings = await this.bookingService.findAll(
      undefined,
      businessId,
    );
    const totalBookings = allBookings.length;

    // Get upcoming bookings (assuming future dates)
    const upcomingBookings = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate > new Date();
    });

    // Get recent reviews
    const reviews = await this.reviewService.findAll(businessId);
    const recentReviews = reviews.slice(0, 5); // Last 5 reviews

    // Get notifications
    const notifications =
      await this.notificationService.listNotifications(vendorId);

    return {
      business: {
        id: business.id,
        name: business.name,
        description: business.description,
        logo: business.logo,
        location: business.location,
        workingDays: business.workingDays,
      },
      stats: {
        servicesCount,
        staffCount,
        totalBookings,
        upcomingBookingsCount: upcomingBookings.length,
        reviewsCount: reviews.length,
      },
      upcomingBookings: upcomingBookings.slice(0, 10), // Next 10 upcoming
      recentReviews,
      notifications: notifications.slice(0, 10), // Recent 10 notifications
    };
  }
}
