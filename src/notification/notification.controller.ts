import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Param,
  Post,
} from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { UpdateNotificationSettingsDto } from "./dto/update-notification-settings.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ResponseMessage("Fetched notifications successfully")
  async list(@GetUser("userId") userId: string) {
    return this.notificationService.listNotifications(userId);
  }

  @Patch(":id/read")
  @ResponseMessage("Marked notification as read")
  async markAsRead(@GetUser("userId") userId: string, @Param("id") id: string) {
    return this.notificationService.markAsRead(userId, id);
  }

  @Get("settings")
  @ResponseMessage("Fetched notification settings successfully")
  async getSettings(@GetUser("userId") userId: string) {
    return this.notificationService.getSettings(userId);
  }

  @Patch("settings")
  @ResponseMessage("Updated notification settings successfully")
  async updateSettings(
    @GetUser("userId") userId: string,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationService.updateSettings(userId, dto);
  }

  @Post("booking-reminder")
  @ResponseMessage("Sent booking reminder successfully")
  async sendBookingReminder(@Body("bookingId") bookingId: string) {
    return this.notificationService.sendBookingReminder(bookingId);
  }
}
