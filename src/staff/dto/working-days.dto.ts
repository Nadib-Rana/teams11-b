import { IsBoolean, IsOptional } from "class-validator";

export class WorkingDaysDto {
  [key: string]: boolean | undefined;

  @IsOptional()
  @IsBoolean()
  monday?: boolean;

  @IsOptional()
  @IsBoolean()
  tuesday?: boolean;

  @IsOptional()
  @IsBoolean()
  wednesday?: boolean;

  @IsOptional()
  @IsBoolean()
  thursday?: boolean;

  @IsOptional()
  @IsBoolean()
  friday?: boolean;

  @IsOptional()
  @IsBoolean()
  saturday?: boolean;

  @IsOptional()
  @IsBoolean()
  sunday?: boolean;
}
