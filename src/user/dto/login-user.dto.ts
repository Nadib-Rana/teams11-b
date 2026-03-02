import { IsString, IsNotEmpty } from 'class-validator';
export class LoginUserDto {
  @IsString()
  @IsNotEmpty()
  anonymousId: string;
}
