// src/business/business.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  ParseUUIDPipe,
  Query,
  Patch,
  Delete,
} from "@nestjs/common";
import { BusinessService } from "./business.service";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { UpdateBusinessDto } from "./dto/update-business.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";

@Controller("businesses")
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  //create businesses
  @Post()
  @ResponseMessage("Create businesses successfully.")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor") // Only vendors can create businesses
  async create(
    @GetUser("userId") userId: string,
    @Body() dto: CreateBusinessDto,
  ) {
    return this.businessService.create(userId, dto);
  }

  @Get()
  @ResponseMessage("Businesses get successfully.")
  async getAll(@Query("categoryId") categoryId?: string) {
    return this.businessService.findAll(categoryId);
  }

  @Get("my-business")
  @ResponseMessage("My Businesses Information get successfully")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  async getMyBusiness(@GetUser("userId") userId: string) {
    return this.businessService.findByVendor(userId);
  }

  @Get(":id")
  async getOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.businessService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  @ResponseMessage("Business updated successfully.")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.businessService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  @ResponseMessage("Business deleted successfully.")
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @GetUser("userId") userId: string,
  ) {
    // অনুমতি যাচাই করুন
    await this.businessService.verifyOwnership(id, userId);
    return this.businessService.delete(id);
  }
}
