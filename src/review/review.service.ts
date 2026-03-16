// src/review/review.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { customer: true, business: true },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.customerId !== dto.customerId) {
      throw new ForbiddenException(
        "Cannot create a review for a booking that does not belong to the customer",
      );
    }

    if (booking.businessId !== dto.businessId) {
      throw new BadRequestException("Business ID does not match booking");
    }

    const existingReview = await this.prisma.review.findFirst({
      where: { bookingId: dto.bookingId },
    });

    if (existingReview) {
      throw new BadRequestException("A review already exists for this booking");
    }

    return this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        customerId: dto.customerId,
        businessId: dto.businessId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        customer: { include: { user: true } },
        business: true,
        booking: true,
      },
    });
  }

  async findAll(businessId?: string, customerId?: string) {
    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (customerId) where.customerId = customerId;

    return this.prisma.review.findMany({
      where,
      include: {
        customer: { include: { user: true } },
        business: true,
        booking: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        customer: { include: { user: true } },
        business: true,
        booking: true,
      },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    return review;
  }

  async update(id: string, dto: UpdateReviewDto, customerId?: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    if (customerId && review.customerId !== customerId) {
      throw new ForbiddenException(
        "Cannot update a review that does not belong to the customer",
      );
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        customer: { include: { user: true } },
        business: true,
        booking: true,
      },
    });
  }

  async delete(id: string, customerId?: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    if (customerId && review.customerId !== customerId) {
      throw new ForbiddenException(
        "Cannot delete a review that does not belong to the customer",
      );
    }

    return this.prisma.review.delete({
      where: { id },
      include: {
        customer: { include: { user: true } },
        business: true,
        booking: true,
      },
    });
  }
}
