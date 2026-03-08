import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import * as bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { randomBytes } from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Register user
  async register(data: any) {
    const { fullName, email, password, role } = data;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException("Email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { fullName, email, password: hashedPassword, role },
    });

    // Create verification token
    const token = randomBytes(32).toString("hex");
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // Send email (use nodemailer)
    console.log(`Send verification email to ${email}: ${token}`);

    return { message: "User registered. Check your email for verification." };
  }

  // Verify email
  async verifyEmail(token: string) {
    const verification = await this.prisma.verificationToken.findUnique({
      where: { token },
    });
    if (!verification || verification.type !== "email_verification")
      throw new BadRequestException("Invalid token");

    if (verification.expiresAt < new Date())
      throw new BadRequestException("Token expired");

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

    const token = randomBytes(32).toString("hex");
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: "password_reset",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });

    console.log(`Send password reset email to ${email}: ${token}`);
    return { message: "Password reset email sent." };
  }

  // Reset password
  async resetPassword(token: string, newPassword: string) {
    const verification = await this.prisma.verificationToken.findUnique({
      where: { token },
    });
    if (!verification || verification.type !== "password_reset")
      throw new BadRequestException("Invalid token");

    if (verification.expiresAt < new Date())
      throw new BadRequestException("Token expired");

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
