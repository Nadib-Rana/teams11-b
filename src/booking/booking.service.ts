// src/booking/booking.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
import { BookingStatus } from "src/generated/prisma/enums";

/**
 * BookingService
 * Handles all business logic for managing bookings.
 * Responsibilities:
 * - Create, retrieve, update, and cancel bookings
 * - Check service availability
 * - Manage booking timeslots
 * - Handle rescheduling
 * - Track booking status changes
 */
@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new booking.
   * Validates that customer, business, service, and staff all exist.
   * Checks for timeslot conflicts.
   * Sets initial status based on availability.
   *
   * @param dto - Booking details (customerId, serviceId, staffId, date, time, type)
   * @returns Created booking with customer, service, and staff info
   * @throws NotFoundException - if any resource doesn't exist
   * @throws ConflictException - if timeslot is already booked
   */
  async create(dto: CreateBookingDto) {
    // Verify all resources exist
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException("Customer not found");
    }

    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const staff = await this.prisma.staff.findUnique({
      where: { id: dto.staffId },
    });

    if (!staff) {
      throw new NotFoundException("Staff not found");
    }

    // Check for conflicting bookings at the same time
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        staffId: dto.staffId,
        date: new Date(dto.date),
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(dto.startTime) } },
              { endTime: { gt: new Date(dto.startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lt: new Date(dto.endTime) } },
              { endTime: { gte: new Date(dto.endTime) } },
            ],
          },
        ],
        status: { in: ["confirmed", "pending"] },
      },
    });

    if (conflictingBooking) {
      throw new ConflictException(
        "Staff member already has a booking at this time",
      );
    }

    // Create the booking (default status: pending)
    return this.prisma.booking.create({
      data: {
        customerId: dto.customerId,
        businessId: dto.businessId,
        serviceId: dto.serviceId,
        staffId: dto.staffId,
        bookingType: dto.bookingType,
        status: "pending",
        date: new Date(dto.date),
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      },
      include: {
        customer: {
          select: { user: { select: { fullName: true, email: true } } },
        },
        service: { select: { title: true, price: true, duration: true } },
        staff: { select: { user: { select: { fullName: true } } } },
        business: { select: { name: true } },
      },
    });
  }

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
   * Updates a booking's status or reschedules it.
   * Cannot update confirmed or cancelled bookings (except to cancel).
   *
   * @param id - Booking UUID
   * @param dto - Updated booking details (status, date, time, cancelReason)
   * @returns Updated booking profile
   * @throws NotFoundException - if booking doesn't exist
   * @throws BadRequestException - if booking cannot be modified
   */
  async update(id: string, dto: UpdateBookingDto) {
    // Verify booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    // Handle cancellation
    if (dto.status === "cancelled") {
      if (!dto.cancelReason) {
        throw new BadRequestException(
          "Cancel reason is required when cancelling",
        );
      }

      return this.prisma.booking.update({
        where: { id },
        data: {
          status: "cancelled",
          cancelReason: dto.cancelReason,
        },
        include: {
          customer: { select: { user: { select: { fullName: true } } } },
          service: { select: { title: true } },
        },
      });
    }

    // Handle rescheduling
    if (dto.date || dto.startTime || dto.endTime) {
      const newDate = dto.date ? new Date(dto.date) : booking.date;
      const newStartTime = dto.startTime
        ? new Date(dto.startTime)
        : booking.startTime;
      const newEndTime = dto.endTime ? new Date(dto.endTime) : booking.endTime;

      // Check for conflicts with new time
      const conflict = await this.prisma.booking.findFirst({
        where: {
          staffId: booking.staffId,
          date: newDate,
          id: { not: id },
          OR: [
            {
              AND: [
                { startTime: { lte: newStartTime } },
                { endTime: { gt: newStartTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: newEndTime } },
                { endTime: { gte: newEndTime } },
              ],
            },
          ],
          status: { in: ["confirmed", "pending"] },
        },
      });

      if (conflict) {
        throw new ConflictException("Staff is not ablaiable Time in this time");
      }

      return this.prisma.booking.update({
        where: { id },
        data: {
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          status: dto.status || booking.status,
        },
        include: {
          customer: { select: { user: { select: { fullName: true } } } },
          service: { select: { title: true } },
          staff: { select: { user: { select: { fullName: true } } } },
        },
      });
    }

    // Update status only
    if (dto.status) {
      return this.prisma.booking.update({
        where: { id },
        data: {
          status: dto.status,
        },
        include: {
          customer: { select: { user: { select: { fullName: true } } } },
          service: { select: { title: true } },
        },
      });
    }

    return booking;
  }

  /**
   * Cancels a booking with a reason.
   *
   * @param id - Booking UUID
   * @param cancelReason - Reason for cancellation
   * @returns Updated booking (now cancelled)
   * @throws NotFoundException - if booking doesn't exist
   */
  async cancel(id: string, cancelReason: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelReason,
      },
    });
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

  /**
   * Checks availability for a staff member on a given date/time.
   *
   * @param staffId - Staff UUID
   * @param date - Date to check
   * @param startTime - Start time to check
   * @param endTime - End time to check
   * @returns true if available, false otherwise
   */
  async checkAvailability(
    staffId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const conflict = await this.prisma.booking.findFirst({
      where: {
        staffId,
        date: new Date(date),
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } },
            ],
          },
        ],
        status: { in: ["confirmed", "pending"] },
      },
    });

    return !conflict;
  }
}
