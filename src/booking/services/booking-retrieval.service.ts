// src/booking/services/booking-retrieval.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/context/prisma.service";
import { BookingStatus } from "../../generated/prisma/enums";

@Injectable()
export class BookingRetrievalService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves all bookings, optionally filtered by customer, business, staff, status, or dates.
   *
   * @param customerId - Optional: filter by customer
   * @param businessId - Optional: filter by business
   * @param staffId - Optional: filter by staff
   * @param status - Optional: filter by booking status
   * @param date - Optional: filter by specific date (ISO format)
   * @param startDate - Optional: filter by date range start (ISO format)
   * @param endDate - Optional: filter by date range end (ISO format)
   * @returns Array of bookings with related data
   */
  async findAll(
    customerId?: string,
    businessId?: string,
    staffId?: string,
    status?: BookingStatus,
    date?: string,
    startDate?: string,
    endDate?: string,
    user?: { userId: string; role: string },
  ) {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (businessId) where.businessId = businessId;
    if (staffId) where.staffId = staffId;
    if (status) where.status = status;

    // Apply date filters
    if (date) {
      // Filter by specific date
      const targetDate = new Date(date);
      where.date = {
        gte: new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
        ),
        lt: new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate() + 1,
        ),
      };
    } else if (startDate || endDate) {
      // Filter by date range
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        where.date.gte = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate(),
        );
      }
      if (endDate) {
        const end = new Date(endDate);
        where.date.lt = new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate() + 1,
        );
      }
    }

    // Apply role-based filtering
    if (user) {
      if (user.role === "vendor") {
        // Vendors can only see bookings for their businesses
        const vendorBusinesses = await this.prisma.business.findMany({
          where: { vendorId: user.userId },
          select: { id: true },
        });
        const businessIds = vendorBusinesses.map((b) => b.id);
        where.businessId = { in: businessIds };
      } else if (user.role === "customer") {
        // Customers can only see their own bookings
        const customer = await this.prisma.customer.findUnique({
          where: { userId: user.userId },
          select: { id: true },
        });
        if (customer) {
          where.customerId = customer.id;
        } else {
          // No customer record found, return empty array
          return [];
        }
      } else if (user.role === "staff") {
        // Staff can only see bookings assigned to them
        const staff = await this.prisma.staff.findUnique({
          where: { userId: user.userId },
          select: { id: true },
        });
        if (staff) {
          where.staffId = staff.id;
        } else {
          // No staff record found, return empty array
          return [];
        }
      }
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: { user: { select: { fullName: true, email: true } } },
        },
        service: { select: { title: true, price: true } },
        staff: { select: { user: { select: { fullName: true } } } },
        business: { select: { name: true } },
      },
      orderBy: { date: "asc" },
    });
  }

  /**
   * Retrieves a specific booking with all related details.
   *
   * @param id - Booking UUID
   * @returns Booking profile with customer, service, staff, and business info
   * @throws NotFoundException - if booking doesn't exist
   */
  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        service: {
          select: {
            title: true,
            price: true,
            description: true,
            duration: true,
          },
        },
        staff: {
          select: { user: { select: { fullName: true, email: true } } },
        },
        business: { select: { name: true, location: true } },
        reviews: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    return booking;
  }

  /**
   * Retrieves all bookings for a customer.
   *
   * @param customerId - Customer UUID
   * @returns Array of customer's bookings
   * @throws NotFoundException - if customer doesn't exist
   */
  async getCustomerBookings(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException("Customer not found");
    }

    return this.findAll(customerId);
  }

  /**
   * Retrieves all bookings for a business.
   *
   * @param businessId - Business UUID
   * @returns Array of business's bookings
   * @throws NotFoundException - if business doesn't exist
   */
  async getBusinessBookings(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    return this.findAll(undefined, businessId);
  }
}
