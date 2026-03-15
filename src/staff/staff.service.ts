// src/staff/staff.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";
import { BookingStatus } from "src/generated/prisma/enums";
import * as bcrypt from "bcryptjs"; // for hashing password when creating user

@Injectable()
export class StaffService {
  /**
   * StaffService handles all business logic for staff member management.
   * Responsibilities:
   * - Create new staff members (auto-create user if needed)
   * - Manage staff information (role, specialties, working days)
   * - Assign/unassign services to staff
   * - Retrieve staff listings and individual details
   * - Generate staff-specific dashboards
   */
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStaffDto) {
    // 1. Ensure the business exists first (vendors only can add staff)
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    // 2. Look up or create the associated user by email
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // create a new user with staff role
      const passwordToHash =
        dto.password ?? Math.random().toString(36).slice(-8);
      const hashed = await bcrypt.hash(passwordToHash, 10);

      user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          password: hashed,
          role: "staff",
          phone: dto.phone,
        },
      });
    } else {
      // user exists
      if (user.role !== "staff") {
        throw new BadRequestException(
          "Email is already registered with a different role",
        );
      }
    }

    // 3. Ensure the staff profile is not already created
    const existingStaff = await this.prisma.staff.findUnique({
      where: { userId: user.id },
    });

    if (existingStaff) {
      throw new BadRequestException(
        "Staff profile already exists for this user",
      );
    }

    // 4. Create the staff record
    return this.prisma.staff.create({
      data: {
        userId: user.id,
        businessId: dto.businessId,
        role: dto.role,
        specialties: dto.specialties,
        workingDays: dto.workingDays,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
            phone: true,
          },
        },
        business: true,
      },
    });
  }

  async findAll(businessId?: string) {
    const where = businessId ? { businessId } : {};

    return this.prisma.staff.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        business: true,
        services: {
          include: {
            service: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        business: true,
        services: {
          include: {
            service: true,
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
            date: true,
            startTime: true,
            endTime: true,
            service: {
              select: {
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException("Staff not found");
    }

    return staff;
  }

  async update(id: string, dto: UpdateStaffDto) {
    // Verify staff exists
    const staff = await this.prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException("Staff not found");
    }

    // Update the staff record
    return this.prisma.staff.update({
      where: { id },
      data: {
        role: dto.role,
        specialties: dto.specialties,
        workingDays: dto.workingDays,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        business: true,
      },
    });
  }

  async delete(id: string) {
    // Verify staff exists
    const staff = await this.prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException("Staff not found");
    }

    // Delete the staff record
    return this.prisma.staff.delete({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async getStaffByBusiness(businessId: string) {
    return this.findAll(businessId);
  }

  async getStaffDashboard(userId: string) {
    // Find the staff associated with this user
    const staff = await this.prisma.staff.findUnique({
      where: { userId },
      include: {
        business: true,
      },
    });

    if (!staff) {
      throw new NotFoundException("Staff profile not found");
    }

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await this.prisma.booking.findMany({
      where: {
        staffId: staff.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                profileImage: true,
              },
            },
          },
        },
        service: {
          select: {
            title: true,
            price: true,
          },
        },
      },
    });

    // Get active customers (bookings with confirmed status)
    const activeBookings = await this.prisma.booking.findMany({
      where: {
        staffId: staff.id,
        status: BookingStatus.confirmed,
      },
      distinct: ["customerId"],
      select: {
        customerId: true,
      },
    });

    return {
      todayBookings: todayBookings.length,
      activeCustomers: activeBookings.length,
      upcomingBookings: todayBookings,
      businessInfo: staff.business,
    };
  }

  async assignServiceToStaff(staffId: string, serviceId: string) {
    // Verify staff exists
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new NotFoundException("Staff not found");
    }

    // Verify service exists and belongs to the same business
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    if (service.businessId !== staff.businessId) {
      throw new ForbiddenException(
        "Service does not belong to the same business",
      );
    }

    // Check if assignment already exists
    const existing = await this.prisma.staffService.findUnique({
      where: {
        staffId_serviceId: {
          staffId,
          serviceId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        "Service is already assigned to this staff",
      );
    }

    // Create the assignment
    return this.prisma.staffService.create({
      data: {
        staffId,
        serviceId,
      },
      include: {
        staff: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        service: true,
      },
    });
  }

  async removeServiceFromStaff(staffId: string, serviceId: string) {
    const existing = await this.prisma.staffService.findUnique({
      where: {
        staffId_serviceId: {
          staffId,
          serviceId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Service assignment not found");
    }

    return this.prisma.staffService.delete({
      where: {
        staffId_serviceId: {
          staffId,
          serviceId,
        },
      },
    });
  }
}
