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
import { StorageService } from "../storage/storage.service";
import { PrismaService } from "../prisma.service";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";

@Controller("api/files")
export class BusinessController {
  constructor(
    private storageService: StorageService,
    private prisma: PrismaService,
  ) {}

  /**
   * Upload business logo
   */
  @Post("business-logo/:businessId")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("Business logo uploaded successfully")
  @UseInterceptors(
    FileInterceptor("logo", {
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
  async uploadBusinessLogo(
    @UploadedFile() file: Express.Multer.File,
    @Param("businessId") businessId: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Delete old logo if exists
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (business?.logoKey) {
      try {
        await this.storageService.deleteFile(business.logoKey, "businesses");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Failed to delete old logo:", errorMessage);
      }
    }

    // Upload new logo
    const objectKey = await this.storageService.uploadFile(
      file,
      "businesses",
      `businesses/${businessId}/logo-${Date.now()}.jpg`,
    );

    // Save to database
    await this.prisma.business.update({
      where: { id: businessId },
      data: { logoKey: objectKey },
    });

    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "businesses",
    );

    return {
      success: true,
      objectKey,
      imageUrl,
      message: "Business logo uploaded successfully",
    };
  }

  /**
   * Upload business logo to temp location (no businessId required)
   */
  @Post("business-logo-temp")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("Temporary business logo uploaded successfully")
  @UseInterceptors(
    FileInterceptor("logo", {
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
  async uploadTempBusinessLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const objectKey = await this.storageService.uploadFile(
      file,
      "businesses",
      `businesses/temp/${Date.now()}-${file.originalname}`,
    );

    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "businesses",
    );

    return {
      success: true,
      objectKey,
      imageUrl,
      message: "Temporary business logo uploaded successfully",
    };
  }

  /**
   * Upload one temporary business gallery image (no businessId required)
   */
  @Post("business-images-temp")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("Temporary business image uploaded successfully")
  @UseInterceptors(
    FileInterceptor("image", {
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
  async uploadTempBusinessImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const objectKey = await this.storageService.uploadFile(
      file,
      "businesses",
      `businesses/temp/${Date.now()}-${file.originalname}`,
    );

    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "businesses",
    );

    return {
      success: true,
      objectKey,
      imageUrl,
      message: "Temporary business image uploaded successfully",
    };
  }

  /**
   * Upload business images (multiple)
   */
  @Post("business-images/:businessId")
  @ResponseMessage("Business images uploaded successfully")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("images", {
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
  async uploadBusinessImages(
    @UploadedFile() file: Express.Multer.File,
    @Param("businessId") businessId: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Upload image
    const objectKey = await this.storageService.uploadFile(
      file,
      "businesses",
      `businesses/${businessId}/images/${Date.now()}-${file.originalname}`,
    );

    // Save to database
    const businessImage = await this.prisma.businessImage.create({
      data: {
        businessId,
        imageKey: objectKey,
      },
    });

    return {
      success: true,
      imageId: businessImage.id,
      objectKey,
      message: "Business image uploaded successfully",
    };
  }

  /**
   * Upload multiple business images to temp location (no businessId required)
   */
  @Post("business-images-temp")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("Temporary business images uploaded successfully")
  @UseInterceptors(
    FileInterceptor("images", {
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
  async uploadTempBusinessImages(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Upload image
    const objectKey = await this.storageService.uploadFile(
      file,
      "businesses",
      `businesses/temp/images/${Date.now()}-${file.originalname}`,
    );

    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "businesses",
    );

    return {
      success: true,
      objectKey,
      imageUrl,
      message: "Temporary business image uploaded successfully",
    };
  }

  /**
   * Delete business image
   */
  @Delete("business-images/:imageId")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("Business image deleted successfully")
  async deleteBusinessImage(@Param("imageId") imageId: string) {
    const businessImage = await this.prisma.businessImage.findUnique({
      where: { id: imageId },
    });

    if (!businessImage) {
      throw new BadRequestException("Image not found");
    }

    // Delete from MinIO
    await this.storageService.deleteFile(businessImage.imageKey, "businesses");

    // Delete from database
    await this.prisma.businessImage.delete({ where: { id: imageId } });

    return { success: true, message: "Image deleted successfully" };
  }

  /**
   * Get presigned URL for business logo
   */
  @Get("business-logo/*path")
  @ResponseMessage("Business logo retrieved successfully")
  async getBusinessLogo(@Param("path") objectKey: string) {
    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "businesses",
      86400, // 24 hours
    );

    return { imageUrl };
  }

  /**
   * Get presigned URL for business gallery image
   */
  @Get("business-images/*path")
  @ResponseMessage("Business image retrieved successfully")
  async getBusinessImage(@Param("path") objectKey: string) {
    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "businesses",
      86400, // 24 hours
    );

    return { imageUrl };
  }
}
