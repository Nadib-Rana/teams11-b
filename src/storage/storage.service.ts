import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { MinioConfigService } from "./minio.config";
// import * as Minio from "minio";

export type BucketType =
  | "profiles"
  | "businesses"
  | "categories"
  | "reviews"
  | "documents";

@Injectable()
export class StorageService {
  constructor(private minioConfig: MinioConfigService) {
    void this.initializeBuckets();
  }

  private async initializeBuckets() {
    const client = this.minioConfig.getClient();
    const bucketTypes: BucketType[] = [
      "profiles",
      "businesses",
      "categories",
      "reviews",
      "documents",
    ];

    for (const type of bucketTypes) {
      const bucketName = this.minioConfig.getBucketName(type);
      try {
        const exists = await client.bucketExists(bucketName);
        if (!exists) {
          await client.makeBucket(bucketName, "us-east-1");
          console.log(`✓ Created MinIO bucket: ${bucketName}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `✗ Failed to create/check bucket ${bucketName}:`,
          errorMessage,
        );
      }
    }
  }

  /**
   * Upload a file to MinIO
   * @param file - Express file object
   * @param bucketType - Type of bucket to upload to
   * @param customObjectName - Optional custom object name (default: auto-generated UUID)
   * @returns Object key (path) in MinIO
   */
  async uploadFile(
    file: Express.Multer.File,
    bucketType: BucketType,
    customObjectName?: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const client = this.minioConfig.getClient();
    const bucketName = this.minioConfig.getBucketName(bucketType);

    // Generate object name if not provided
    const objectName = customObjectName || `${Date.now()}-${file.originalname}`;

    try {
      await client.putObject(bucketName, objectName, file.buffer, file.size, {
        "Content-Type": file.mimetype,
      });

      return objectName;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to upload file: ${errorMessage}`,
      );
    }
  }

  /**
   * Upload multiple files to MinIO
   * @param files - Array of Express file objects
   * @param bucketType - Type of bucket to upload to
   * @returns Array of object keys
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    bucketType: BucketType,
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided");
    }

    const uploadPromises = files.map((file) =>
      this.uploadFile(file, bucketType),
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to upload multiple files: ${errorMessage}`,
      );
    }
  }

  /**
   * Delete a file from MinIO
   * @param objectName - Object key to delete
   * @param bucketType - Type of bucket
   */
  async deleteFile(objectName: string, bucketType: BucketType): Promise<void> {
    const client = this.minioConfig.getClient();
    const bucketName = this.minioConfig.getBucketName(bucketType);

    try {
      await client.removeObject(bucketName, objectName);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to delete file: ${errorMessage}`,
      );
    }
  }

  /**
   * Get a presigned URL for downloading a file
   * @param objectName - Object key
   * @param bucketType - Type of bucket
   * @param expiresIn - URL expiration time in seconds (default: 24 hours)
   * @returns Presigned download URL
   */
  async getPresignedDownloadUrl(
    objectName: string,
    bucketType: BucketType,
    expiresIn: number = 86400,
  ): Promise<string> {
    const client = this.minioConfig.getClient();
    const bucketName = this.minioConfig.getBucketName(bucketType);

    try {
      return await client.presignedGetObject(bucketName, objectName, expiresIn);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to generate presigned URL: ${errorMessage}`,
      );
    }
  }

  /**
   * Get a presigned PUT URL for uploading a file
   * @param objectName - Object key
   * @param bucketType - Type of bucket
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Presigned upload URL
   */
  async getPresignedUploadUrl(
    objectName: string,
    bucketType: BucketType,
    expiresIn: number = 3600,
  ): Promise<string> {
    const client = this.minioConfig.getClient();
    const bucketName = this.minioConfig.getBucketName(bucketType);

    try {
      return await client.presignedPutObject(bucketName, objectName, expiresIn);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to generate presigned upload URL: ${errorMessage}`,
      );
    }
  }

  /**
   * Get direct object URL (for public files)
   * @param objectName - Object key
   * @param bucketType - Type of bucket
   * @returns Direct object URL
   */
  async moveFile(
    bucketType: BucketType,
    sourceObjectName: string,
    destinationObjectName: string,
  ): Promise<string> {
    const client = this.minioConfig.getClient();
    const bucketName = this.minioConfig.getBucketName(bucketType);

    if (sourceObjectName === destinationObjectName) {
      return destinationObjectName;
    }

    try {
      const copySource = `/${bucketName}/${sourceObjectName}`;
      await client.copyObject(bucketName, destinationObjectName, copySource);
      await client.removeObject(bucketName, sourceObjectName);
      return destinationObjectName;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to move file from ${sourceObjectName} to ${destinationObjectName}: ${errorMessage}`,
      );
    }
  }

  getObjectUrl(objectName: string, bucketType: BucketType): string {
    const bucketName = this.minioConfig.getBucketName(bucketType);
    const minioUrl = this.minioConfig.getMinioUrl();
    return `${minioUrl}/${bucketName}/${objectName}`;
  }

  /**
   * Check if a file exists
   * @param objectName - Object key
   * @param bucketType - Type of bucket
   * @returns Boolean indicating if file exists
   */
  async fileExists(
    objectName: string,
    bucketType: BucketType,
  ): Promise<boolean> {
    const client = this.minioConfig.getClient();
    const bucketName = this.minioConfig.getBucketName(bucketType);

    try {
      await client.statObject(bucketName, objectName);
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "NotFound"
      ) {
        return false;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to check file existence: ${errorMessage}`,
      );
    }
  }
}
