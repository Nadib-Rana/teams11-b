import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Post,
  Delete,
  Param,
} from "@nestjs/common";
import { CustomerService } from "./customer.service";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { AddFavoriteDto } from "./dto/add-favorite.dto";
import { JoinWaitingListDto } from "./dto/join-waiting-list.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";

@Controller("customer")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("customer")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get("me")
  @ResponseMessage("Fetched customer profile successfully")
  async getProfile(@GetUser("userId") userId: string) {
    return this.customerService.getProfile(userId);
  }

  @Patch("me")
  @ResponseMessage("Updated customer profile successfully")
  async updateProfile(
    @GetUser("userId") userId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customerService.updateProfile(userId, dto);
  }

  @Get("me/favorites")
  @ResponseMessage("Fetched favorites successfully")
  async getFavorites(@GetUser("userId") userId: string) {
    return this.customerService.getFavorites(userId);
  }

  @Post("me/favorites")
  @ResponseMessage("Added to favorites successfully")
  async addFavorite(
    @GetUser("userId") userId: string,
    @Body() dto: AddFavoriteDto,
  ) {
    return this.customerService.addFavorite(userId, dto);
  }

  @Delete("me/favorites/:businessId")
  @ResponseMessage("Removed from favorites successfully")
  async removeFavorite(
    @GetUser("userId") userId: string,
    @Param("businessId") businessId: string,
  ) {
    return this.customerService.removeFavorite(userId, businessId);
  }

  @Get("me/waiting-list")
  @ResponseMessage("Fetched waiting list successfully")
  async getWaitingList(@GetUser("userId") userId: string) {
    return this.customerService.getWaitingList(userId);
  }

  @Post("me/waiting-list")
  @ResponseMessage("Joined waiting list successfully")
  async joinWaitingList(
    @GetUser("userId") userId: string,
    @Body() dto: JoinWaitingListDto,
  ) {
    return this.customerService.joinWaitingList(userId, dto);
  }

  @Delete("me/waiting-list/:id")
  @ResponseMessage("Removed waiting list entry successfully")
  async removeWaitingListEntry(
    @GetUser("userId") userId: string,
    @Param("id") id: string,
  ) {
    return this.customerService.removeWaitingListEntry(userId, id);
  }
}
