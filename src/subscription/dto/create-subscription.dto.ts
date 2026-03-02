import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  // IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  postExpiryHours: number;

  @IsString()
  @IsOptional()
  themeColor?: string;

  // @IsBoolean()
  // @IsOptional()
  // canHideResponse?: boolean;

  @IsNumber()
  @IsNotEmpty()
  price: number;
}
