import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";

export enum UserRole {
  CUSTOMER = "customer",
  VENDOR = "vendor",
}

export class RegisterDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  // @IsString()
  // @IsOptional()
  // phone?: string;
}
