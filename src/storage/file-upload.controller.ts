import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  //   Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { StorageService } from "../storage/storage.service";
import { PrismaService } from "../prisma.service";

@Controller("api/files")
export class FileUploadController {
  constructor(
    private storageService: StorageService,
    private prisma: PrismaService,
  ) {}

  /**
   * Upload a user profile image
   * @param file - The uploaded file
   * @param userId - The user's ID from JWT token
   */
  @Post("profile-image")
  @UseInterceptors(
    FileInterceptor("profileImage", {
      fileFilter: (req, file, cb) => {
        // Allow only image types
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException("Only image files are allowed"),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @GetUser("userId") userId: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Delete old profile image if exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.profileImage) {
      try {
        await this.storageService.deleteFile(user.profileImage, "profiles");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Failed to delete old profile image:", errorMessage);
      }
    }

    // Upload new image to MinIO
    const objectKey = await this.storageService.uploadFile(
      file,
      "profiles",
      `users/${userId}/profile-${Date.now()}.jpg`,
    );

    // Save object key to database
    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: objectKey },
    });

    // Generate URL (optional - for immediate response)
    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "profiles",
    );

    return {
      success: true,
      objectKey,
      imageUrl,
      message: "Profile image uploaded successfully",
    };
  }

  /**
   * Get presigned URL for a profile image
   * @param objectKey - The MinIO object key stored in database
   */
  @Get("profile-image/:objectKey")
  async getProfileImage(@Param("objectKey") objectKey: string) {
    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "profiles",
      86400, // 24 hours
    );

    return { imageUrl };
  }

  /**
   * Delete profile image
   * @param userId - User ID from JWT token
   */
  @Delete("profile-image")
  async deleteProfileImage(@GetUser("userId") userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.profileImage) {
      throw new BadRequestException("No profile image to delete");
    }

    await this.storageService.deleteFile(user.profileImage, "profiles");

    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
    });

    return { success: true, message: "Profile image deleted successfully" };
  }

  /**
   * Upload business logo
   */
  @Post("business-logo/:businessId")
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
    if (business?.logo) {
      try {
        await this.storageService.deleteFile(business.logo, "businesses");
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
      data: { logo: objectKey },
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
   * Upload business images (multiple)
   */
  @Post("business-images/:businessId")
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
        imageUrl: objectKey,
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
   * Delete business image
   */
  @Delete("business-images/:imageId")
  async deleteBusinessImage(@Param("imageId") imageId: string) {
    const businessImage = await this.prisma.businessImage.findUnique({
      where: { id: imageId },
    });

    if (!businessImage) {
      throw new BadRequestException("Image not found");
    }

    // Delete from MinIO
    await this.storageService.deleteFile(businessImage.imageUrl, "businesses");

    // Delete from database
    await this.prisma.businessImage.delete({ where: { id: imageId } });

    return { success: true, message: "Image deleted successfully" };
  }
}
