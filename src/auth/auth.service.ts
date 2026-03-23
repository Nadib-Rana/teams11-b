import {
  UnauthorizedException,
  BadRequestException,
} from "../common/exceptions/http.exceptions";
import { PrismaService } from "../common/context/prisma.service";
import * as bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { randomInt } from "crypto";
import { RegisterDto } from "./dto/register.dto";
import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

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

    // Create user and associated profile in a transaction
    const user = await this.prisma.user.create({
      data: { fullName, email, password: hashedPassword, role },
    });

    // Create role-specific profile
    if (role === "vendor") {
      await this.prisma.vendor.create({
        data: { userId: user.id },
      });
    } else if (role === "customer") {
      await this.prisma.customer.create({
        data: { userId: user.id },
      });
    }

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
        subject: "Welcome to Teams11!",
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
  // async verifyEmail(token: string) {
  //   const verification = await this.prisma.verificationToken.findFirst({
  //     where: { token, used: false },
  //   });

  //   if (!verification || verification.type !== "email_verification")
  //     throw new BadRequestException("Invalid OTP");

  //   if (verification.expiresAt < new Date())
  //     throw new BadRequestException("OTP expired");

  //   await this.prisma.user.update({
  //     where: { id: verification.userId },
  //     data: { isVerified: true },
  //   });

  //   await this.prisma.verificationToken.update({
  //     where: { id: verification.id },
  //     data: { used: true },
  //   });

  //   return { message: "Email verified successfully." };
  // }

  async verifyEmail(token: string) {
    const verification = await this.prisma.verificationToken.findFirst({
      where: { token, used: false },
    });

    if (!verification || verification.type !== "email_verification")
      throw new BadRequestException("Invalid OTP");

    if (verification.expiresAt < new Date())
      throw new BadRequestException("OTP expired");

    // ✅ Get user first
    const user = await this.prisma.user.findUnique({
      where: { id: verification.userId },
    });

    if (!user) throw new BadRequestException("User not found");

    // ✅ Mark verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    // ✅ Mark token used
    await this.prisma.verificationToken.update({
      where: { id: verification.id },
      data: { used: true },
    });

    // ✅ Generate JWT token (AUTO LOGIN)
    const payload = { sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: "Email verified successfully",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // Login (accept email or phone as identifier; staff bypass verification)
  async login(
    identifier: string | undefined,
    password: string,
  ): Promise<{ accessToken: string; isVerified: boolean }> {
    if (!identifier) {
      // কাস্টম BadRequestException (message, code)
      throw new BadRequestException(
        "Email or phone must be provided",
        "MISSING_IDENTIFIER",
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    // ১. ইউজার না থাকলে
    if (!user)
      throw new UnauthorizedException(
        "Invalid credentials",
        false,
        "INVALID_CREDENTIALS",
      );

    // ২. ইমেইল ভেরিফাইড না থাকলে
    if (user.role !== "staff" && !user.isVerified) {
      // এখানে অবজেক্টের বদলে সরাসরি আর্গুমেন্ট পাস করুন
      throw new UnauthorizedException(
        "Email not verified", // 1. message
        user.isVerified, // 2. isVerified (boolean)
        "EMAIL_NOT_VERIFIED", // 3. code
        undefined, // 4. errors
        "PLEASE_VERIFY_EMAIL", // 5. instruction
      );
    }

    // ৩. পাসওয়ার্ড চেক
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      throw new UnauthorizedException(
        "Invalid credentials",
        user.isVerified,
        "INVALID_PASSWORD",
      );

    const payload = { sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);

    // Success response
    return {
      accessToken: token,
      isVerified: user.isVerified,
    };
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
        subject: "Password Reset OTP",
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

  // Resend OTP for email verification
  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException("User not found");

    if (user.isVerified)
      throw new BadRequestException("Email already verified");

    // Invalidate existing unused email verification tokens
    await this.prisma.verificationToken.updateMany({
      where: {
        userId: user.id,
        type: "email_verification",
        used: false,
      },
      data: { used: true },
    });

    // Generate new OTP
    const token = this.generateOTP();
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // OTP 5 min valid
      },
    });

    // Send OTP email
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: "Email Verification OTP - Teams11",
        template: "./verification",
        context: {
          name: user.fullName,
          otp: token,
        },
      });
    } catch (error) {
      console.error("Error sending resend OTP email:", error);
    }

    return { message: "OTP resent. Check your email." };
  }
}
