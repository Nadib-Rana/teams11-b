import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginUserDto } from './dto/login-user.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('auth')
  @ResponseMessage('Login Successfull')
  login(@Body() dto: LoginUserDto) {
    return this.userService.auth(dto.anonymousId);
  }

  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
