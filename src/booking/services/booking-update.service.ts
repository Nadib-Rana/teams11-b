// src/booking/services/booking-update.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/context/prisma.service";
import { UpdateBookingDto } from "../dto/update-booking.dto";
import { BookingStatus } from "src/generated/prisma/enums";

@Injectable()
export class BookingUpdateService {
  constructor(private prisma: PrismaService) {}

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
    if (dto.status === BookingStatus.cancelled) {
      if (!dto.cancelReason) {
        throw new BadRequestException(
          "Cancel reason is required when cancelling",
        );
      }

      return this.prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.cancelled,
          cancelReason: dto.cancelReason,
        },
        include: {
          customer: { select: { user: { select: { fullName: true } } } },
          service: { select: { title: true } },
        },
      });
    }

    // Handle staff assignment or rescheduling
    if (dto.staffId || dto.date || dto.startTime || dto.endTime) {
      const newStaffId = dto.staffId || booking.staffId;
      const newDate = dto.date ? new Date(dto.date) : booking.date;
      const dateStr = newDate.toISOString().split("T")[0];
      const newStartTime = dto.startTime
        ? new Date(`${dateStr}T${dto.startTime}`)
        : booking.startTime;
      const newEndTime = dto.endTime
        ? new Date(`${dateStr}T${dto.endTime}`)
        : booking.endTime;

      // If assigning staff, verify staff exists and belongs to the business
      if (dto.staffId) {
        const staff = await this.prisma.staff.findUnique({
          where: { id: dto.staffId },
          include: { business: true },
        });

        if (!staff) {
          throw new NotFoundException("Staff not found");
        }

        if (staff.businessId !== booking.businessId) {
          throw new BadRequestException(
            "Staff does not belong to this business",
          );
        }

        // Check if staff is available on this day
        const dayOfWeek = newDate
          .toLocaleString("en-US", {
            weekday: "long",
          })
          .toLowerCase();
        const workingDays = staff.workingDays as Record<string, boolean> | null;
        if (!workingDays || !workingDays[dayOfWeek]) {
          throw new BadRequestException(
            `Staff is not available on ${dayOfWeek}`,
          );
        }
      }

      // Check for booking conflicts
      if (newStaffId) {
        const conflict = await this.prisma.booking.findFirst({
          where: {
            staffId: newStaffId,
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
            status: { in: [BookingStatus.confirmed, BookingStatus.pending] },
          },
        });

        if (conflict) {
          throw new ConflictException("Staff is not available at this time");
        }
      }

      return this.prisma.booking.update({
        where: { id },
        data: {
          staffId: newStaffId,
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          status: dto.status ? (dto.status as BookingStatus) : booking.status,
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
      // If confirming, ensure staff is assigned
      if (dto.status === BookingStatus.confirmed && !booking.staffId) {
        throw new BadRequestException(
          "Cannot confirm booking without assigning staff",
        );
      }

      return this.prisma.booking.update({
        where: { id },
        data: {
          status: dto.status as BookingStatus,
        },
        include: {
          customer: { select: { user: { select: { fullName: true } } } },
          service: { select: { title: true } },
          staff: { select: { user: { select: { fullName: true } } } },
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
        status: BookingStatus.cancelled,
        cancelReason,
      },
    });
  }
}
