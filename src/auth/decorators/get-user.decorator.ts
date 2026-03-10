import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

// Define a basic User interface based on your JWT payload or user entity.
// Adjust properties as needed (e.g., add email, roles, etc.).
interface User {
  id: string;
  // Add other properties here, e.g., username?: string;
}

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as User | undefined;
    return data ? (user as unknown as Record<string, unknown>)?.[data] : user;
  },
);
