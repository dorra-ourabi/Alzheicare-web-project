import { IsEmail, IsOptional, IsString, IsInt } from 'class-validator';
import { AtLeastOneField } from '../../common/validators/at-least-one-field.validator.js';

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

  @AtLeastOneField(['doctorId', 'doctorEmail'], {
    message: 'Either doctorId or doctorEmail must be provided.',
  })
  validationField?: boolean;
}
