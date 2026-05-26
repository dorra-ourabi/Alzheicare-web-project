import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RespondStatus } from './respond-invitation.dto.js';

export class RespondViaTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsEnum(RespondStatus)
  action: RespondStatus;
}
