import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    // optionally verify name uniqueness if needed
    // check if a category with this name already exists (non-unique search)
    const exists = await this.prisma.category.findFirst({
      where: { name: dto.name },
    });
    if (exists) {
      throw new BadRequestException("Category with that name already exists");
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        image: dto.image,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        businesses: true,
        services: true,
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { businesses: true, services: true },
    });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException("Category not found");
    }

    if (dto.name) {
      // ensure no other category has the same name
      const other = await this.prisma.category.findFirst({
        where: { name: dto.name },
      });
      if (other && other.id !== id) {
        throw new BadRequestException(
          "Another category already uses that name",
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        image: dto.image,
      },
    });
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException("Category not found");
    }

    return this.prisma.category.delete({ where: { id } });
  }
}
