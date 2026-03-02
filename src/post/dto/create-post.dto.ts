import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { ContentType, PostType } from '../../generated/prisma/client';

export class CreatePostDto {
  @IsUUID()
  categoryId: string;

  @IsEnum(ContentType)
  @IsNotEmpty()
  contentType: ContentType;

  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  @IsString()
  voiceUrl?: string;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    // Postman form-data থেকে আসা স্ট্রিং বা Implicit conversion থেকে আসা বুলিয়ান হ্যান্ডল করা
    console.log('This is a dto:', value);
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isResponseDefaultHidden?: boolean;

  @IsEnum(PostType)
  @IsNotEmpty()
  postType: PostType;
}
