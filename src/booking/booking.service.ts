// src/booking/booking.service.ts
import { Injectable } from "@nestjs/common";
import { BookingCreationService } from "./services/booking-creation.service";
import { BookingRetrievalService } from "./services/booking-retrieval.service";
import { BookingUpdateService } from "./services/booking-update.service";
import { BookingAvailabilityService } from "./services/booking-availability.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
import { BookingStatus } from "src/generated/prisma/enums";

/**
 * BookingService
 * Main service that orchestrates booking operations using specialized services.
 * Responsibilities:
 * - Coordinate between creation, retrieval, update, and availability services
 * - Provide unified interface for booking management
 * - Handle cross-cutting concerns
 */
@Injectable()
export class BookingService {
  constructor(
    private creationService: BookingCreationService,
    private retrievalService: BookingRetrievalService,
    private updateService: BookingUpdateService,
    private availabilityService: BookingAvailabilityService,
  ) {}

  /**
   * Creates a new booking.
   * Delegates to BookingCreationService.
   */
  async create(dto: CreateBookingDto) {
    return this.creationService.create(dto);
  }

  /**
   * Retrieves all bookings, optionally filtered.
   * Delegates to BookingRetrievalService.
   */
  async findAll(
    customerId?: string,
    businessId?: string,
    staffId?: string,
    status?: BookingStatus,
  ) {
    return this.retrievalService.findAll(
      customerId,
      businessId,
      staffId,
      status,
    );
  }

  /**
   * Retrieves a specific booking with all related details.
   * Delegates to BookingRetrievalService.
   */
  async findOne(id: string) {
    return this.retrievalService.findOne(id);
  }

  /**
   * Updates a booking's status or reschedules it.
   * Delegates to BookingUpdateService.
   */
  async update(id: string, dto: UpdateBookingDto) {
    return this.updateService.update(id, dto);
  }

  /**
   * Cancels a booking with a reason.
   * Delegates to BookingUpdateService.
   */
  async cancel(id: string, cancelReason: string) {
    return this.updateService.cancel(id, cancelReason);
  }

  /**
   * Retrieves all bookings for a customer.
   * Delegates to BookingRetrievalService.
   */
  async getCustomerBookings(customerId: string) {
    return this.retrievalService.getCustomerBookings(customerId);
  }

  /**
   * Retrieves all bookings for a business.
   * Delegates to BookingRetrievalService.
   */
  async getBusinessBookings(businessId: string) {
    return this.retrievalService.getBusinessBookings(businessId);
  }

  /**
   * Checks availability for a staff member on a given date/time.
   * Delegates to BookingAvailabilityService.
   */
  async checkAvailability(
    staffId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    return this.availabilityService.checkAvailability(
      staffId,
      date,
      startTime,
      endTime,
    );
  }

  /**
   * Gets available staff for a business on a given date/time.
   * Delegates to BookingAvailabilityService.
   */
  async getAvailableStaff(
    businessId: string,
    date: string,
    startTime: string,
    endTime: string,
  ) {
    return this.availabilityService.getAvailableStaff(
      businessId,
      date,
      startTime,
      endTime,
    );
  }
}
