// src/service/service.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  // ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { BookingStatus } from "src/generated/prisma/enums";

/**
 * ServiceService
 * Handles all business logic for managing services.
 * Responsibilities:
 * - Create, retrieve, update, delete services
 * - Manage service-staff assignments
 * - Filter services by business or category
 */
@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new service for a business.
   * Validates that business and category exist before creation.
   *
   * @param dto - Service details (businessId, categoryId, title, price, duration, type, etc.)
   * @returns Created service with category and business info
   * @throws NotFoundException - if business or category doesn't exist
   */
  async create(dto: CreateServiceDto) {
    // Verify business exists
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    // Create the service
    return this.prisma.service.create({
      data: {
        businessId: dto.businessId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        duration: dto.duration,
        color: dto.color,
        type: dto.type,
      },
      include: {
        business: true,
        category: true,
        staff: {
          select: {
            staff: {
              select: {
                id: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Retrieves all services, optionally filtered by business or category.
   *
   * @param businessId - Optional: filter by business
   * @param categoryId - Optional: filter by category
   * @returns Array of services with related data
   */
  async findAll(businessId?: string, categoryId?: string) {
    const where: { businessId?: string; categoryId?: string } = {}; //we are used the type as it is prisma

    if (businessId) where.businessId = businessId;
    if (categoryId) where.categoryId = categoryId;

    return this.prisma.service.findMany({
      where,
      include: {
        business: true,
        category: true,
        staff: {
          include: {
            staff: {
              select: {
                id: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });
  }

  /**
   * Retrieves a specific service with all related data.
   *
   * @param id - Service UUID
   * @returns Service profile with business, category, assigned staff, and booking count
   * @throws NotFoundException - if service doesn't exist
   */
  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        business: true,
        category: true,
        staff: {
          include: {
            staff: {
              select: {
                id: true,
                user: { select: { fullName: true, email: true } },
              },
            },
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
            date: true,
            customer: { select: { user: { select: { fullName: true } } } },
          },
          take: 10,
        },
      },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    return service;
  }

  /**
   * Updates a service's information.
   * Cannot change businessId or categoryId; use delete/create for those changes.
   *
   * @param id - Service UUID
   * @param dto - Updated service details
   * @returns Updated service profile
   * @throws NotFoundException - if service doesn't exist
   */
  async update(id: string, dto: UpdateServiceDto) {
    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    // Update the service
    return this.prisma.service.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        duration: dto.duration,
        color: dto.color,
        type: dto.type,
      },
      include: {
        business: true,
        category: true,
      },
    });
  }

  /**
   * Removes a service from the system.
   * Cannot delete if bookings exist; bookings must be cancelled first.
   *
   * @param id - Service UUID
   * @returns Deleted service summary
   * @throws NotFoundException - if service doesn't exist
   * @throws BadRequestException - if service has active bookings
   */
  async delete(id: string) {
    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    // Check for existing bookings
    const bookingCount = await this.prisma.booking.count({
      where: {
        serviceId: id,
        status: { in: [BookingStatus.confirmed, BookingStatus.pending] },
      },
    });

    if (bookingCount > 0) {
      throw new BadRequestException(
        "Cannot delete service with active bookings",
      );
    }

    // Delete the service
    return this.prisma.service.delete({
      where: { id },
      include: { business: true, category: true },
    });
  }

  /**
   * Retrieves all services for a specific business.
   *
   * @param businessId - Business UUID
   * @returns Array of services in the business
   * @throws NotFoundException - if business doesn't exist
   */
  async getServicesByBusiness(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    return this.findAll(businessId);
  }

  /**
   * Retrieves all services in a specific category.
   *
   * @param categoryId - Category UUID
   * @returns Array of services in the category
   * @throws NotFoundException - if category doesn't exist
   */
  async getServicesByCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    return this.findAll(undefined, categoryId);
  }
}
