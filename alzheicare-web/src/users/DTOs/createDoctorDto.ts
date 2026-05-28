import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './createUserDto.js';

export class CreateDoctorDto extends CreateUserDto {
  @IsString()
  @IsOptional()
  licenceNumber?: string;

  @IsString()
  @IsOptional()
  specialization?: string;
}
