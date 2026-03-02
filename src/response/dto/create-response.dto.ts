import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ContentType } from '../../generated/prisma/client';

export class CreateResponseDto {
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @IsEnum(ContentType)
  @IsNotEmpty()
  contentType: ContentType;

  @IsString()
  @IsOptional()
  textContent?: string;

  @IsString()
  @IsOptional()
  voiceUrl?: string;

  @IsUUID()
  @IsOptional()
  parentResponseId?: string;
}
