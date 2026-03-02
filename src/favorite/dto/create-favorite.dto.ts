import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateFavoriteDto {
  @IsUUID(4)
  @IsNotEmpty()
  postId: string;
}
