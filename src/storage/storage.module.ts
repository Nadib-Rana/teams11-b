import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { StorageService } from "./storage.service";
import { MinioConfigService } from "./minio.config";
import { FileUploadController } from "./file-upload.controller";

@Module({
  imports: [ConfigModule],
  controllers: [FileUploadController],
  providers: [MinioConfigService, StorageService],
  exports: [StorageService, MinioConfigService],
})
export class StorageModule {}
