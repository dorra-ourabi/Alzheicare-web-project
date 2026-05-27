import { IsEmail, IsOptional, IsString, IsInt, IsPositive, MaxLength, IsNotEmpty } from 'class-validator';
import { AtLeastOneField } from '../../common/validators/at-least-one-field.validator.js';

export class CreateInvitationDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  doctorId?: number;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  doctorEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @AtLeastOneField(['doctorId', 'doctorEmail'], {
    message: 'Either doctorId or doctorEmail must be provided.',
  })
  validationField?: boolean;
}
