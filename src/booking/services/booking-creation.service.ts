// src/booking/services/booking-creation.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/context/prisma.service";
import { CreateBookingDto } from "../dto/create-booking.dto";
import { BookingStatus } from "src/generated/prisma/enums";

@Injectable()
export class BookingCreationService {
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

    // Staff is optional; if provided, verify it exists
    if (dto.staffId) {
      const staff = await this.prisma.staff.findUnique({
        where: { id: dto.staffId },
      });

      if (!staff) {
        throw new NotFoundException("Staff not found");
      }

      // Check for conflicting bookings at the same time
      const startDateTime = new Date(`${dto.date}T${dto.startTime}`);
      const endDateTime = new Date(`${dto.date}T${dto.endTime}`);
      const conflictingBooking = await this.prisma.booking.findFirst({
        where: {
          staffId: dto.staffId,
          date: new Date(dto.date),
          OR: [
            {
              AND: [
                { startTime: { lte: startDateTime } },
                { endTime: { gt: startDateTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endDateTime } },
                { endTime: { gte: endDateTime } },
              ],
            },
          ],
          status: { in: [BookingStatus.confirmed, BookingStatus.pending] },
        },
      });

      if (conflictingBooking) {
        throw new ConflictException(
          "Staff member already has a booking at this time",
        );
      }
    }

    // Create the booking (default status: pending)
    return this.prisma.booking.create({
      data: {
        customerId: dto.customerId,
        businessId: dto.businessId,
        serviceId: dto.serviceId,
        staffId: dto.staffId,
        bookingType: dto.bookingType,
        status: BookingStatus.pending,
        date: new Date(dto.date),
        startTime: new Date(`${dto.date}T${dto.startTime}`),
        endTime: new Date(`${dto.date}T${dto.endTime}`),
      },
      include: {
        customer: {
          select: { user: { select: { fullName: true, email: true } } },
        },
        service: { select: { title: true, price: true, duration: true } },
        staff: dto.staffId
          ? { select: { user: { select: { fullName: true } } } }
          : false,
        business: { select: { name: true } },
      },
    });
  }
}
