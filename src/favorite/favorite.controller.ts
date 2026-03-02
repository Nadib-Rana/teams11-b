import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Favorite } from '../generated/prisma/client';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post('toggle')
  @ResponseMessage('Toggel successful')
  async toggle(
    @Headers('user-id') userId: string | undefined,
    @Body() dto: CreateFavoriteDto,
  ): Promise<{ favorited: boolean; message: string }> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.favoriteService.toggleFavorite(userId, dto);
  }

  @Get()
  @ResponseMessage('Show your favorit successfully')
  async findAll(
    @Headers('user-id') userId: string | undefined,
  ): Promise<Favorite[]> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.favoriteService.getMyFavorites(userId);
  }
}
