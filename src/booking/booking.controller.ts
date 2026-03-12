// src/booking/booking.controller.ts
/**
 * BookingController
 * Routes for managing bookings.
 * Customers can create, view, reschedule, and cancel bookings.
 * Vendors can view and manage bookings for their business.
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import { BookingService } from "./booking.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
import { BookingStatus } from "src/generated/prisma/enums";
// import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
// import { RolesGuard } from "../auth/guards/roles.guard";
// import { Roles } from "../auth/decorators/roles.decorator";
// import { GetUser } from "../auth/decorators/get-user.decorator";

@Controller("bookings")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * POST /bookings
   * Create a new booking for a service.
   * Customers create bookings for services offered by businesses.
   *
   * @param dto - Booking details (customerId, serviceId, staffId, date, time, type)
   * @returns Created booking with confirmation
   */
  @Post()
  async create(@Body() dto: CreateBookingDto) {
    return this.bookingService.create(dto);
  }

  /**
   * GET /bookings
   * Retrieve bookings with optional filters (customer, business, staff, status).
   * Can be used by vendors to view business bookings or customers to view their bookings.
   *
   * @param customerId - Optional: filter by customer
   * @param businessId - Optional: filter by business
   * @param staffId - Optional: filter by staff
   * @param status - Optional: filter by status (pending, confirmed, cancelled, waiting)
   * @returns Array of bookings matching filters
   */
  @Get()
  async findAll(
    @Query("customerId") customerId?: string,
    @Query("businessId") businessId?: string,
    @Query("staffId") staffId?: string,
    @Query("status") status?: BookingStatus,
  ) {
    return this.bookingService.findAll(customerId, businessId, staffId, status);
  }

  /**
   * GET /bookings/:id
   * Retrieve detailed information about a specific booking.
   * No authentication required.
   *
   * @param id - Booking UUID
   * @returns Booking details with customer, service, staff, and business info
   */
  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.bookingService.findOne(id);
  }

  /**
   * PUT /bookings/:id
   * Update a booking (change status, reschedule, or cancel).
   * Customers and vendors can update bookings.
   *
   * @param id - Booking UUID
   * @param dto - Updated booking details
   * @returns Updated booking profile
   */
  @Put(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingService.update(id, dto);
  }

  /**
   * POST /bookings/:id/cancel
   * Cancel a booking with a provided reason.
   * Customers can cancel their own bookings.
   *
   * @param id - Booking UUID
   * @param body - Contains cancelReason
   * @returns Cancelled booking
   */
  @Post(":id/cancel")
  async cancel(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { cancelReason: string },
  ) {
    return this.bookingService.cancel(id, body.cancelReason);
  }

  /**
   * GET /bookings/customer/:customerId
   * Retrieve all bookings for a specific customer.
   *
   * @param customerId - Customer UUID
   * @returns Customer's bookings
   */
  @Get("customer/:customerId")
  async getCustomerBookings(
    @Param("customerId", ParseUUIDPipe) customerId: string,
  ) {
    return this.bookingService.getCustomerBookings(customerId);
  }

  /**
   * GET /bookings/business/:businessId
   * Retrieve all bookings for a specific business.
   * Useful for vendor dashboard.
   *
   * @param businessId - Business UUID
   * @returns Business's bookings
   */
  @Get("business/:businessId")
  async getBusinessBookings(
    @Param("businessId", ParseUUIDPipe) businessId: string,
  ) {
    return this.bookingService.getBusinessBookings(businessId);
  }

  /**
   * GET /bookings/availability/:staffId
   * Check if a staff member is available for a given date/time.
   *
   * @param staffId - Staff UUID
   * @param date - Date to check (ISO format)
   * @param startTime - Start time to check (HH:MM:SS)
   * @param endTime - End time to check (HH:MM:SS)
   * @returns { available: boolean }
   */
  @Get("availability/:staffId")
  async checkAvailability(
    @Param("staffId", ParseUUIDPipe) staffId: string,
    @Query("date") date: string,
    @Query("startTime") startTime: string,
    @Query("endTime") endTime: string,
  ) {
    const available = await this.bookingService.checkAvailability(
      staffId,
      date,
      startTime,
      endTime,
    );
    return { available };
  }
}
