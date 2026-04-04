// src/dashboard/dashboard.service.ts
import { Injectable } from "@nestjs/common";
import { BusinessService } from "../business/business.service";
import { BookingService } from "../booking/booking.service";
import { ServiceService } from "../service/service.service";
import { ReviewService } from "../review/review.service";
import { StaffService } from "../staff/staff.service";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../common/context/prisma.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly businessService: BusinessService,
    private readonly bookingService: BookingService,
    private readonly serviceService: ServiceService,
    private readonly reviewService: ReviewService,
    private readonly staffService: StaffService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
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

    // Get all bookings for the business
    const allBookings = await this.bookingService.findAll(
      undefined,
      businessId,
    );

    // Calculate today's date boundaries
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    // Today's bookings
    const todaysBookings = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= startOfToday && bookingDate < endOfToday;
    });
    const todaysBookingsCount = todaysBookings.length;

    // Total bookings
    const totalBookings = allBookings.length;

    // Revenue today
    const revenueToday = todaysBookings.reduce((sum, booking) => {
      const price = booking.service?.price;
      const numericPrice =
        typeof price === "string" ? parseFloat(price) : Number(price ?? 0);
      return sum + (Number.isFinite(numericPrice) ? numericPrice : 0);
    }, 0);

    // Total revenue
    const totalRevenue = allBookings.reduce((sum, booking) => {
      const price = booking.service?.price;
      const numericPrice =
        typeof price === "string" ? parseFloat(price) : Number(price ?? 0);
      return sum + (Number.isFinite(numericPrice) ? numericPrice : 0);
    }, 0);

    // Active clients (unique customers with bookings today)
    const activeClients = new Set(
      todaysBookings.map((booking) => booking.customerId),
    ).size;

    // Total clients (unique customers who have ever booked)
    const totalClients = new Set(
      allBookings.map((booking) => booking.customerId),
    ).size;

    // Get all staff for the business
    const allStaff = await this.staffService.findAll(businessId);
    const totalStaffs = allStaff.length;

    // Active staffs (staff with bookings today)
    const activeStaffIds = new Set(
      todaysBookings.map((booking) => booking.staffId),
    );
    const activeStaffs = activeStaffIds.size;

    // Get reviews and calculate rating
    const reviews = await this.reviewService.findAll(businessId);
    const rating =
      reviews.length > 0
        ? reviews.reduce((acc, review) => acc + (review.rating ?? 0), 0) /
          reviews.length
        : 0;

    // Get reviews with service details for individual service ratings
    const reviewsWithService = await this.prisma.review.findMany({
      where: { businessId },
      include: {
        booking: {
          include: {
            service: true,
          },
        },
      },
    });

    // Calculate individual service ratings
    const serviceRatingMap = new Map<
      string,
      { totalRating: number; count: number; name: string }
    >();
    reviewsWithService.forEach((review) => {
      const serviceId = review.booking.service.id;
      const serviceName = review.booking.service.title;
      const rating = review.rating ?? 0;

      if (serviceRatingMap.has(serviceId)) {
        const existing = serviceRatingMap.get(serviceId)!;
        existing.totalRating += rating;
        existing.count += 1;
      } else {
        serviceRatingMap.set(serviceId, {
          totalRating: rating,
          count: 1,
          name: serviceName,
        });
      }
    });

    const serviceRatings = Array.from(serviceRatingMap.entries()).map(
      ([serviceId, data]) => ({
        serviceId,
        serviceName: data.name,
        averageRating:
          data.count > 0
            ? Math.round((data.totalRating / data.count) * 10) / 10
            : 0,
        reviewCount: data.count,
      }),
    );

    // Services list with names
    const servicesList = services.map((service) => ({
      id: service.id,
      name: service.title,
      price: service.price,
      duration: service.duration,
    }));

    // Get notifications count
    const notifications =
      await this.notificationService.listNotifications(vendorId);
    const notificationsCount = notifications.length;

    // Get upcoming bookings (assuming future dates)
    const upcomingBookings = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate > new Date();
    });

    // Get recent reviews
    const recentReviews = reviews.slice(0, 5); // Last 5 reviews

    return {
      business: {
        id: business.id,
        name: business.name,
        description: business.description,
        logoKey: business.logoKey,
        location: business.location,
        workingDays: business.workingDays,
      },
      stats: {
        servicesCount,
        todaysBookings: todaysBookingsCount,
        totalBookings,
        revenueToday,
        totalRevenue,
        activeClients,
        totalClients,
        activeStaffs,
        totalStaffs,
        rating: Math.round(rating * 10) / 10, // Round to 1 decimal
        notificationsCount,
        upcomingBookingsCount: upcomingBookings.length,
        reviewsCount: reviews.length,
      },
      services: servicesList,
      serviceRatings,
      upcomingBookings: upcomingBookings.slice(0, 10), // Next 10 upcoming
      recentReviews,
      notifications: notifications.slice(0, 10), // Recent 10 notifications
    };
  }
}
