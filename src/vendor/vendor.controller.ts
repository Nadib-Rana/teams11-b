import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { VendorService } from "./vendor.service";
import { UpdateVendorDto } from "./dto/update-vendor.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";

@Controller("vendor")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("vendor")
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get("me")
  @ResponseMessage("Fetched vendor profile successfully")
  async getProfile(@GetUser("userId") userId: string) {
    return this.vendorService.getProfile(userId);
  }

  @Get("referral")
  @ResponseMessage("Fetched vendor referral summary successfully")
  async getReferralSummary(@GetUser("userId") userId: string) {
    return this.vendorService.getReferralSummary(userId);
  }

  @Patch("me")
  @ResponseMessage("Updated vendor profile successfully")
  async updateProfile(
    @GetUser("userId") userId: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendorService.updateProfile(userId, dto);
  }
}
