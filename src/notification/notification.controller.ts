import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Param,
  Post,
  Delete,
} from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { UserDeviceService } from "./user-device.service";
import { UpdateNotificationSettingsDto } from "./dto/update-notification-settings.dto";
import { CreateNotificationTemplateDto } from "./dto/create-notification-template.dto";
import { SendBookingReminderDto } from "./dto/send-booking-reminder.dto";
import { RegisterDeviceDto, UpdateFcmTokenDto } from "./dto/device.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly userDeviceService: UserDeviceService,
  ) {}

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
  async sendBookingReminder(@Body() dto: SendBookingReminderDto) {
    return this.notificationService.sendBookingReminder(dto.bookingId);
  }

  @Get("analytics")
  @ResponseMessage("Fetched notification analytics successfully")
  async getAnalytics(@GetUser("userId") userId: string) {
    return this.notificationService.getNotificationAnalytics(userId);
  }

  @Get("templates")
  @ResponseMessage("Fetched notification templates successfully")
  async getTemplates() {
    return this.notificationService.getNotificationTemplates();
  }

  @Post("templates")
  @ResponseMessage("Created notification template successfully")
  async createTemplate(@Body() templateData: CreateNotificationTemplateDto) {
    return this.notificationService.createNotificationTemplate(templateData);
  }

  // Device management endpoints for push notifications
  @Post("devices")
  @ResponseMessage("Device registered successfully")
  async registerDevice(
    @GetUser("userId") userId: string,
    @Body() deviceData: RegisterDeviceDto,
  ) {
    return this.userDeviceService.registerDevice(
      userId,
      deviceData.deviceId,
      deviceData.fcmToken,
      deviceData.deviceType,
      deviceData.deviceName,
    );
  }

  @Patch("devices/:deviceId")
  @ResponseMessage("FCM token updated successfully")
  async updateFcmToken(
    @GetUser("userId") userId: string,
    @Param("deviceId") deviceId: string,
    @Body() data: UpdateFcmTokenDto,
  ) {
    return this.userDeviceService.updateFcmToken(
      userId,
      deviceId,
      data.fcmToken,
    );
  }

  @Delete("devices/:deviceId")
  @ResponseMessage("Device unregistered successfully")
  async unregisterDevice(
    @GetUser("userId") userId: string,
    @Param("deviceId") deviceId: string,
  ) {
    return this.userDeviceService.unregisterDevice(userId, deviceId);
  }

  @Get("devices")
  @ResponseMessage("Fetched user devices successfully")
  async getUserDevices(@GetUser("userId") userId: string) {
    return this.userDeviceService.getUserDevices(userId);
  }
}
