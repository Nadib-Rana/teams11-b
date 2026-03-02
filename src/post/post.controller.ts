import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Headers,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ResponseMessage('Post created successfully') // "create" -> "created"
  @UseInterceptors(FileInterceptor('voiceFile'))
  async create(
    @Headers('user-id') userId: string,
    @Body() dto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // console.log('CreatePostDto', dto);
    if (!userId) throw new UnauthorizedException('User ID required');
    // console.log('This is controllar', dto);
    return await this.postService.create(userId, dto, file);
  }

  @Get()
  @ResponseMessage('Public feed retrieved successfully')
  async getFeed() {
    return await this.postService.getPublicFeed();
  }

  @Get('category/:categoryId')
  @ResponseMessage('Posts filtered by category successfully')
  async getByCategory(
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
  ) {
    return await this.postService.findByCategory(categoryId);
  }

  @Get('history')
  @ResponseMessage('User post history retrieved successfully')
  async getHistory(@Headers('user-id') userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return await this.postService.getMyHistory(userId);
  }

  @Get(':id')
  @ResponseMessage('Post details retrieved successfully')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('user-id') userId?: string,
  ) {
    return await this.postService.findOne(id, userId);
  }

  @Delete(':id')
  @ResponseMessage('Post deleted successfully')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('user-id') userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return await this.postService.remove(id, userId);
  }
}
