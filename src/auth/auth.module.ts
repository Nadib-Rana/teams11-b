import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { ContextModule } from "../common/context/context.module";

@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET || "defaultSecret" }),
    ContextModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
