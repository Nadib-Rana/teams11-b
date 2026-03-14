import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyTokenDto } from "./dto/verify-token.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { RequestPasswordResetDto } from "./dto/request-Password-Reset.dto";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ResponseMessage("User is Registed successful")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("verify-email")
  @ResponseMessage("Email varifyed successful")
  verifyEmail(@Body() dto: VerifyTokenDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post("login")
  @ResponseMessage("login successful")
  login(@Body() dto: LoginDto) {
    // choose email or phone; validation ensures at least one is present
    const identifier = dto.email ?? dto.phone;
    return this.authService.login(identifier, dto.password);
  }

  @Post("request-password-reset")
  @ResponseMessage("Password reset request send successful")
  requestReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post("reset-password")
  @ResponseMessage("Password reset successful")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
