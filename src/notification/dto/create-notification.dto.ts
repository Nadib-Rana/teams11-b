import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { NotificationType } from '../../generated/prisma/client';

export class CreateNotificationDto {
  @IsUUID()
  userId: string; // প্রাপক (Recipient)

  @IsUUID()
  triggerUserId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsUUID()
  postId?: string;

  @IsOptional()
  @IsUUID()
  responseId?: string;

  @IsOptional()
  @IsUUID()
  parentResponseId?: string;

  @IsOptional()
  @IsUUID()
  favoriteId?: string;
}
