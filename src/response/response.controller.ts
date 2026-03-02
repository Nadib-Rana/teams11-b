import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Headers,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { ResponseService } from './response.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('responses')
export class ResponseController {
  constructor(private readonly responseService: ResponseService) {}

  @Post()
  @ResponseMessage('Response created successfully')
  async create(
    @Headers('user-id') userId: string,
    @Body() dto: CreateResponseDto,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.responseService.create(userId, dto);
  }

  @Get('post/:postId')
  @ResponseMessage('Public responses retrieved successfully')
  async findAllByPost(@Param('postId', new ParseUUIDPipe()) postId: string) {
    return this.responseService.findAllByPost(postId);
  }

  @Delete(':id')
  @ResponseMessage('Response deleted successfully')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('user-id') userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.responseService.remove(id, userId);
  }
}
