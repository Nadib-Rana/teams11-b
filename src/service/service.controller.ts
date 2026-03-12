// src/service/service.controller.ts
/**
 * ServiceController
 * Routes for managing services offered by businesses.
 * Vendors can create, update, and delete services.
 * Customers can browse and filter services.
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
import { ServiceService } from "./service.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";

@Controller("services")
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  /**
   * POST /services
   * Create a new service for a business.
   * Only vendors can create services.
   *
   * @param dto - Service creation details
   * @returns Created service profile
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ResponseMessage("Create Service successfully !")
  @Roles("vendor")
  async create(@Body() dto: CreateServiceDto) {
    return this.serviceService.create(dto);
  }

  /**
   * GET /services
   * Retrieve all services, optionally filtered by business or category.
   * No authentication required for public browsing.
   *
   * @param businessId - Optional: filter by business
   * @param categoryId - Optional: filter by category
   * @returns Array of services
   */
  @Get()
  @ResponseMessage("All Service Show successfully !")
  async findAll(
    @Query("businessId") businessId?: string,
    @Query("categoryId") categoryId?: string,
  ) {
    return this.serviceService.findAll(businessId, categoryId);
  }

  /**
   * GET /services/:id
   * Retrieve detailed information about a specific service.
   * No authentication required.
   *
   * @param id - Service UUID
   * @returns Service details with business, category, staff, and recent bookings
   */
  @Get(":id")
  @ResponseMessage("Service Get successfully !")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.serviceService.findOne(id);
  }

  /**
   * PUT /services/:id
   * Update a service's information.
   * Only vendors can update services in their business.
   *
   * @param id - Service UUID
   * @param dto - Updated service details
   * @returns Updated service profile
   */
  @Put(":id")
  @ResponseMessage("Service oparation successfully !")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.serviceService.update(id, dto);
  }

  /**
   * DELETE /services/:id
   * Remove a service.
   * Only vendors can delete services.
   *
   * @param id - Service UUID
   * @returns Deletion confirmation
   */
  @Delete(":id")
  @ResponseMessage("Delete Service successfully !")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.serviceService.delete(id);
  }

  /**
   * GET /services/business/:businessId
   * Retrieve all services for a specific business.
   *
   * @param businessId - Business UUID
   * @returns Array of services in the business
   */
  @Get("business/:businessId")
  @ResponseMessage("All services for a onely for your business.")
  async getByBusiness(@Param("businessId", ParseUUIDPipe) businessId: string) {
    return this.serviceService.getServicesByBusiness(businessId);
  }

  /**
   * GET /services/category/:categoryId
   * Retrieve all services in a specific category.
   *
   * @param categoryId - Category UUID
   * @returns Array of services in the category
   */
  @Get("category/:categoryId")
  @ResponseMessage("Filter all services in a specific category.")
  async getByCategory(@Param("categoryId", ParseUUIDPipe) categoryId: string) {
    return this.serviceService.getServicesByCategory(categoryId);
  }
}
