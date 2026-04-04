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
export class StaffController {
  constructor(
    private storageService: StorageService,
    private prisma: PrismaService,
  ) {}

  /**
   * Upload staff profile image to temp location (no staffId required)
   */
  @Post("staff-image-temp")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  @ResponseMessage("Temporary staff image uploaded successfully")
  @UseInterceptors(
    FileInterceptor("staffImage", {
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
  async uploadTempStaffImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const objectKey = await this.storageService.uploadFile(
      file,
      "staff",
      `staff/temp/${Date.now()}-${file.originalname}`,
    );

    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "staff",
    );

    return {
      success: true,
      objectKey,
      imageUrl,
      message: "Temporary staff image uploaded successfully",
    };
  }

  /**
   * Upload staff profile image
   */
  @Post("staff-image/:staffId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  @ResponseMessage("Staff image uploaded successfully")
  @UseInterceptors(
    FileInterceptor("staffImage", {
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
  async uploadStaffImage(
    @UploadedFile() file: Express.Multer.File,
    @Param("staffId") staffId: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Check if staff exists
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new BadRequestException("Staff not found");
    }

    // Delete old staff image if exists
    if (staff.image) {
      try {
        await this.storageService.deleteFile(staff.image, "staff");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Failed to delete old staff image:", errorMessage);
      }
    }

    // Upload new image
    const objectKey = await this.storageService.uploadFile(
      file,
      "staff",
      `staff/${staffId}/profile-${Date.now()}.jpg`,
    );

    // Save to database
    await this.prisma.staff.update({
      where: { id: staffId },
      data: { image: objectKey },
    });

    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "staff",
    );

    return {
      success: true,
      objectKey,
      imageUrl,
      message: "Staff image uploaded successfully",
    };
  }

  /**
   * Get presigned URL for staff image
   */
  @Get("staff-image/*path")
  @ResponseMessage("Staff image retrieved successfully")
  async getStaffImage(@Param("path") objectKey: string) {
    const imageUrl = await this.storageService.getPresignedDownloadUrl(
      objectKey,
      "staff",
      86400, // 24 hours
    );

    return { imageUrl };
  }

  /**
   * Delete staff image
   */
  @Delete("staff-image/:staffId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("vendor")
  @ResponseMessage("Staff image deleted successfully")
  async deleteStaffImage(@Param("staffId") staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new BadRequestException("Staff not found");
    }

    if (!staff.image) {
      throw new BadRequestException("No staff image to delete");
    }

    await this.storageService.deleteFile(staff.image, "staff");

    await this.prisma.staff.update({
      where: { id: staffId },
      data: { image: null },
    });

    return { success: true, message: "Staff image deleted successfully" };
  }
}
