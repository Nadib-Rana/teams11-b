// src/booking/services/booking-retrieval.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/context/prisma.service";
import { BookingStatus } from "../../generated/prisma/enums";

@Injectable()
export class BookingRetrievalService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves all bookings, optionally filtered by customer, business, or staff.
   *
   * @param customerId - Optional: filter by customer
   * @param businessId - Optional: filter by business
   * @param staffId - Optional: filter by staff
   * @param status - Optional: filter by booking status
   * @returns Array of bookings with related data
   */
  async findAll(
    customerId?: string,
    businessId?: string,
    staffId?: string,
    status?: BookingStatus,
  ) {
    const where: {
      customerId?: string;
      businessId?: string;
      staffId?: string;
      status?: BookingStatus;
    } = {};
    if (customerId) where.customerId = customerId;
    if (businessId) where.businessId = businessId;
    if (staffId) where.staffId = staffId;
    if (status) where.status = status;

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
