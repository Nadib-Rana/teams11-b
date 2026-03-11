// src/staff/staff.controller.ts
/**
 * StaffController
 * Routes for managing staff members, assigned services, and staff-specific dashboards.
 * Vendors can create and manage staff; staff can view their own dashboard.
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import { StaffService } from "./staff.service";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";

@Controller("staff")
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  /**
   * POST /staff
   * Create a new staff member for a business.
   * Only vendors can create staff members.
   * If the user does not exist, a new user account is created with role 'staff'.
   * @param dto - Staff creation details (email, fullName, phone, businessId, etc.)
   * @returns Created staff profile with user info
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  async create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  /**
   * GET /staff
   * Retrieve all staff members, optionally filtered by businessId.
   * No authentication required for public listing.
   * @param businessId - Optional: filter staff by business ID
   * @returns Array of staff profiles with user and service details
   */
  @Get()
  async findAll(@Query("businessId") businessId?: string) {
    return this.staffService.findAll(businessId);
  }

  /**
   * GET /staff/dashboard/overview
   * Retrieve staff member's personal dashboard overview.
   * Only accessible to users with role 'staff'.
   * Shows today's bookings and active customers.
   * @param userId - Authenticated staff member's user ID
   * @returns Dashboard data: today's bookings count, active customers, booking details
   */
  @Get("dashboard/overview")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("staff")
  async getDashboard(@GetUser("userId") userId: string) {
    return this.staffService.getStaffDashboard(userId);
  }

  /**
   * GET /staff/:id
   * Retrieve detailed information about a specific staff member.
   * No authentication required for public access.
   * @param id - Staff member's UUID
   * @returns Staff profile with user info, business details, services, and bookings
   */
  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.staffService.findOne(id);
  }

  /**
   * PUT /staff/:id
   * Update staff member's information (role, specialties, working days).
   * Only vendors (for management) or the staff member themselves can update.
   * @param id - Staff member's UUID
   * @param dto - Updated staff details
   * @returns Updated staff profile
   */
  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor", "staff")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, dto);
  }

  /**
   * DELETE /staff/:id
   * Remove a staff member record from the system.
   * Only vendors can delete staff members.
   * @param id - Staff member's UUID
   * @returns Deleted staff profile summary
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.staffService.delete(id);
  }

  /**
   * POST /staff/:staffId/services/:serviceId
   * Assign a service to a staff member.
   * Only vendors can assign services.
   * Ensures the service belongs to the same business as the staff.
   * @param staffId - Staff member's UUID
   * @param serviceId - Service's UUID to assign
   * @returns Created service assignment
   */
  @Post(":staffId/services/:serviceId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  async assignService(
    @Param("staffId", ParseUUIDPipe) staffId: string,
    @Param("serviceId", ParseUUIDPipe) serviceId: string,
  ) {
    return this.staffService.assignServiceToStaff(staffId, serviceId);
  }

  /**
   * DELETE /staff/:staffId/services/:serviceId
   * Remove a service assignment from a staff member.
   * Only vendors can remove service assignments.
   * @param staffId - Staff member's UUID
   * @param serviceId - Service's UUID to remove
   * @returns Deletion confirmation
   */
  @Delete(":staffId/services/:serviceId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  async removeService(
    @Param("staffId", ParseUUIDPipe) staffId: string,
    @Param("serviceId", ParseUUIDPipe) serviceId: string,
  ) {
    return this.staffService.removeServiceFromStaff(staffId, serviceId);
  }
}
