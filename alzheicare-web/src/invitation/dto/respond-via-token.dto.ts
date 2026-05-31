import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { RespondStatus } from './respond-invitation.dto.js';

export class RespondViaTokenDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9a-f]{64}$/)
  token!: string;

  @IsEnum(RespondStatus)
  @IsNotEmpty()
  action!: RespondStatus;
}
