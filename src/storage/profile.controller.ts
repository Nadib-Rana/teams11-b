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
import { GetUser } from "../auth/decorators/get-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { StorageService } from "../storage/storage.service";
import { PrismaService } from "../prisma.service";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";

@Controller("api/files")
export class ProfileController {
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
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("Profile image uploaded successfully")
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
   * Upload profile image to temp location (for registration or profile setup)
   */
  @Post("profile-image-temp")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("Temporary profile image uploaded successfully")
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
  async uploadTempProfileImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const objectKey = await this.storageService.uploadFile(
      file,
      "profiles",
      `profiles/temp/${Date.now()}-${file.originalname}`,
    );

    // Generate URL (optional - for immediate response)
    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "profiles",
    );

    return {
      success: true,
      objectKey,
      imageUrl,
      message: "Temporary profile image uploaded successfully",
    };
  }

  /**
   * Get presigned URL for a profile image
   * @param objectKey - The MinIO object key stored in database
   */
  @Get("profile-image/*path")
  @ResponseMessage("Profile image retrieved successfully")
  async getProfileImage(@Param("path") objectKey: string) {
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
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("Profile image deleted successfully")
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
}
