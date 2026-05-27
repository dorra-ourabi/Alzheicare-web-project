import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './createUserDto.js';

export class CreatePatientDto extends CreateUserDto {
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
