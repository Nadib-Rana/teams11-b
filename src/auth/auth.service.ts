import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../common/context/prisma.service";
import * as bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { randomInt } from "crypto";
import { RegisterDto } from "./dto/register.dto";
import { MailerService } from "@nestjs-modules/mailer"; // এটি ইম্পোর্ট করা হয়েছে

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  // Helper: generate 6-digit numeric OTP
  private generateOTP(): string {
    return "" + randomInt(100000, 999999);
  }

  // Register user
  async register(data: RegisterDto) {
    const { fullName, email, password, role } = data;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException("Email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { fullName, email, password: hashedPassword, role },
    });

    // Generate numeric OTP
    const token = this.generateOTP();
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // OTP 5 min valid
      },
    });

    // Send opt to main
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: "Welcome to Atech Solution!",
        template: "./verification",
        context: {
          name: fullName,
          otp: token,
        },
      });
    } catch (error) {
      console.error("Error sending email:", error);
    }

    return { message: "User registered. Check your email for OTP." };
  }

  // Verify email / OTP
  async verifyEmail(token: string) {
    const verification = await this.prisma.verificationToken.findFirst({
      where: { token, used: false },
    });

    if (!verification || verification.type !== "email_verification")
      throw new BadRequestException("Invalid OTP");

    if (verification.expiresAt < new Date())
      throw new BadRequestException("OTP expired");

    await this.prisma.user.update({
      where: { id: verification.userId },
      data: { isVerified: true },
    });

    await this.prisma.verificationToken.update({
      where: { id: verification.id },
      data: { used: true },
    });

    return { message: "Email verified successfully." };
  }

  // Login
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    if (!user.isVerified) throw new UnauthorizedException("Email not verified");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const payload = { sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);

    return { accessToken: token };
  }

  // Password reset request
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException("User not found");

    const token = this.generateOTP();
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: "password_reset",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // পাসওয়ার্ড রিসেট ইমেইল
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: "Password Reset OTP - Atech",
        template: "./verification",
        context: {
          name: user.fullName,
          otp: token,
        },
      });
    } catch (error) {
      console.error("Reset mail failed:", error);
    }

    return { message: "Password reset OTP sent." };
  }

  // Reset password
  async resetPassword(token: string, newPassword: string) {
    const verification = await this.prisma.verificationToken.findFirst({
      where: { token, used: false },
    });

    if (!verification || verification.type !== "password_reset")
      throw new BadRequestException("Invalid OTP");

    if (verification.expiresAt < new Date())
      throw new BadRequestException("OTP expired");

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: verification.userId },
      data: { password: hashedPassword },
    });

    await this.prisma.verificationToken.update({
      where: { id: verification.id },
      data: { used: true },
    });

    return { message: "Password reset successfully." };
  }
}
