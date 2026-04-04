// src/booking/services/booking-availability.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/context/prisma.service";
import { BookingStatus } from "src/generated/prisma/enums";

@Injectable()
export class BookingAvailabilityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Checks availability for a staff member on a given date/time.
   * Checks both working days and booking conflicts.
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
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        business: true,
      },
    });

    if (!staff) {
      return false;
    }

    // Check working days
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate
      .toLocaleString("en-US", {
        weekday: "long",
      })
      .toLowerCase();

    const staffWorkingDays = staff.workingDays as Record<
      string,
      boolean
    > | null;
    if (!staffWorkingDays || !staffWorkingDays[dayOfWeek]) {
      return false;
    }

    const businessWorkingDays =
      staff.business &&
      (staff.business.workingDays as Record<string, boolean> | null);
    if (businessWorkingDays && !businessWorkingDays[dayOfWeek]) {
      return false;
    }

    // Check for booking conflicts
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    const conflict = await this.prisma.booking.findFirst({
      where: {
        staffId,
        date: bookingDate,
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

    return !conflict;
  }

  /**
   * Gets available staff for a business on a given date/time.
   *
   * @param businessId - Business UUID
   * @param date - Date to check
   * @param startTime - Start time to check
   * @param endTime - End time to check
   * @returns Array of available staff
   */
  async getAvailableStaff(
    businessId: string,
    date: string,
    startTime: string,
    endTime: string,
  ) {
    const staffList = await this.prisma.staff.findMany({
      where: { businessId },
      include: {
        user: { select: { fullName: true, email: true } },
        services: { include: { service: true } },
      },
    });

    const availableStaff: typeof staffList = [];

    for (const staff of staffList) {
      const isAvailable = await this.checkAvailability(
        staff.id,
        date,
        startTime,
        endTime,
      );
      if (isAvailable) {
        availableStaff.push(staff);
      }
    }

    return availableStaff;
  }
}
