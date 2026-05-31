import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from './createUserDto.js';
import { ChronicDiseaseType } from '../../../generated/prisma/client.js';

export class CreateConditionDto {
  @IsEnum(ChronicDiseaseType)
  diseaseType!: ChronicDiseaseType;

  @IsDateString()
  @IsOptional()
  diagnosisDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  additionalDisease?: string;
}

export class CreatePatientDto extends CreateUserDto {
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConditionDto)
  @IsOptional()
  conditions?: CreateConditionDto[];
}
