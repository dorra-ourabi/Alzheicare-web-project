import { IsEmail, IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateInvitationDto {
  @IsOptional()
  @IsInt()
  doctorId?: number;

  @IsOptional()
  @IsEmail()
  doctorEmail?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
