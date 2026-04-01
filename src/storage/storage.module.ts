import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { StorageService } from "./storage.service";
import { MinioConfigService } from "./minio.config";
import { ProfileController } from "./profile.controller";
import { BusinessController } from "./business.controller";
import { CategoryController } from "./category.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [ProfileController, BusinessController, CategoryController],
  providers: [MinioConfigService, StorageService],
  exports: [StorageService, MinioConfigService],
})
export class StorageModule {}
