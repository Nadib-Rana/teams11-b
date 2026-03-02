import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // আপনার প্রিজমা পাথের সাথে মিলিয়ে নিন
import { Category } from '../generated/prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        icon: dto.icon,
      },
    });
  }

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }
}
