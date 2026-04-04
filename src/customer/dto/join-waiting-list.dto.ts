import { IsUUID, IsDateString } from "class-validator";

export class JoinWaitingListDto {
  @IsUUID()
  serviceId: string;

  @IsDateString()
  preferredDate: string; // ISO date format
}
