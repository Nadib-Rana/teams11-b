import { IsOptional, IsString, IsEmail, IsUrl } from "class-validator";

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  profileImage?: string;
}
