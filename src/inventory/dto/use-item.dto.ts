import { IsString, IsInt, Min } from 'class-validator';

export class UseItemDto {
  @IsString()
  itemType: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
