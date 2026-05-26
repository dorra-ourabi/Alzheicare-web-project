import { IsEnum } from 'class-validator';

export enum RespondStatus {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class RespondInvitationDto {
  @IsEnum(RespondStatus)
  status: RespondStatus;
}
