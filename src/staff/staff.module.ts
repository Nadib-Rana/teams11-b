// src/staff/staff.module.ts
import { Module } from "@nestjs/common";
import { StaffService } from "./staff.service";
import { StaffController } from "./staff.controller";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
