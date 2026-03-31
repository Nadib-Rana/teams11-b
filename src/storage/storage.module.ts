import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { StorageService } from "./storage.service";
import { MinioConfigService } from "./minio.config";

@Module({
  imports: [ConfigModule],
  providers: [MinioConfigService, StorageService],
  exports: [StorageService, MinioConfigService],
})
export class StorageModule {}
