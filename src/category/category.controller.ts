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
} from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";

@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ResponseMessage("Catagory created successfully.")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Get()
  @ResponseMessage("All Catagory Get successfully.")
  async findAll() {
    return this.categoryService.findAll();
  }

  @Get(":id")
  @ResponseMessage("Catagory Get successfully.")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.categoryService.findOne(id);
  }

  @Put(":id")
  @ResponseMessage("Catagory update successfully.")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @Delete(":id")
  @ResponseMessage("Catagory Deleted successfully.")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.categoryService.delete(id);
  }
}
