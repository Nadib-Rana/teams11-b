import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreatePurchaseDto {
  @IsUUID()
  @IsNotEmpty()
  subscriptionId: string;

  @IsString()
  @IsNotEmpty()
  platform: string; // "ios" or "android"

  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  status: string; // "active", "expired", "canceled"

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}
