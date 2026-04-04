import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { StorageService } from "../storage/storage.service";
import { PrismaService } from "../prisma.service";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";

@Controller("api/files")
export class CategoryController {
  constructor(
    private storageService: StorageService,
    private prisma: PrismaService,
  ) {}

  /**
   * Upload category image to temp location (no categoryId required)
   */
  @Post("category-image-temp")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  @ResponseMessage("Temporary category image uploaded successfully")
  @UseInterceptors(
    FileInterceptor("categoryImage", {
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException("Only image files are allowed"),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadTempCategoryImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const objectKey = await this.storageService.uploadFile(
      file,
      "categories",
      `categories/temp/${Date.now()}-${file.originalname}`,
    );

    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "categories",
    );

    return {
      success: true,
      objectKey,
      imageUrl,
      message: "Temporary category image uploaded successfully",
    };
  }

  /**
   * Upload category image
   */
  @Post("category-image/:categoryId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  @ResponseMessage("Category image uploaded successfully")
  @UseInterceptors(
    FileInterceptor("categoryImage", {
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException("Only image files are allowed"),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadCategoryImage(
    @UploadedFile() file: Express.Multer.File,
    @Param("categoryId") categoryId: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException("Category not found");
    }

    // Delete old category image if exists
    if (category.image) {
      try {
        await this.storageService.deleteFile(category.image, "categories");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Failed to delete old category image:", errorMessage);
      }
    }

    // Upload new image
    const objectKey = await this.storageService.uploadFile(
      file,
      "categories",
      `categories/${categoryId}/image-${Date.now()}.jpg`,
    );

    // Save to database
    await this.prisma.category.update({
      where: { id: categoryId },
      data: { image: objectKey },
    });

    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "categories",
    );

    return {
      success: true,
      objectKey,
      imageUrl,
      message: "Category image uploaded successfully",
    };
  }

  /**
   * Get presigned URL for category image
   */
  @Get("category-image/*path")
  @ResponseMessage("Category image retrieved successfully")
  async getCategoryImage(@Param("path") objectKey: string) {
    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "categories",
      86400, // 24 hours
    );

    return { imageUrl };
  }

  /**
   * Delete category image
   */
  @Delete("category-image/:categoryId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  @ResponseMessage("Category image deleted successfully")
  async deleteCategoryImage(@Param("categoryId") categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException("Category not found");
    }

    if (!category.image) {
      throw new BadRequestException("No category image to delete");
    }

    await this.storageService.deleteFile(category.image, "categories");

    await this.prisma.category.update({
      where: { id: categoryId },
      data: { image: null },
    });

    return { success: true, message: "Category image deleted successfully" };
  }
}
