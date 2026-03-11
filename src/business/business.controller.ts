// src/business/business.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import { BusinessService } from "./business.service";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";

@Controller("businesses")
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor") // Only vendors can create businesses
  async create(
    @GetUser("userId") userId: string,
    @Body() dto: CreateBusinessDto,
  ) {
    return this.businessService.create(userId, dto);
  }

  @Get()
  async getAll() {
    return this.businessService.findAll();
  }

  @Get("my-business")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  async getMyBusiness(@GetUser("userId") userId: string) {
    return this.businessService.findByVendor(userId);
  }

  @Get(":id")
  async getOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.businessService.findOne(id);
  }
}
