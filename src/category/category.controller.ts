import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category } from '../generated/prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ResponseMessage('Services created sucecssfully')
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ResponseMessage('All services get sucessully')
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Services created sucecssfully by ID')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Category | null> {
    return this.categoryService.findOne(id);
  }
}
