// src/review/review.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { ReviewService } from "./review.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";

@Controller("reviews")
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  //   Only customer can create the review.

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  @ResponseMessage("Created review successfully")
  async create(@Body() dto: CreateReviewDto) {
    return this.reviewService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  @Roles("vendor")
  async findAll(
    @Query("businessId") businessId?: string,
    @Query("customerId") customerId?: string,
  ) {
    return this.reviewService.findAll(businessId, customerId);
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.reviewService.findOne(id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  @ResponseMessage("Updated review successfully")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
    @GetUser("userId") userId?: string,
  ) {
    return this.reviewService.update(id, dto, userId);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  @ResponseMessage("Deleted review successfully")
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @GetUser("userId") userId?: string,
  ) {
    return this.reviewService.delete(id, userId);
  }
}
