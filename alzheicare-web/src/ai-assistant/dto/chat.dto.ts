import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatDto {
  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  patientId?: number;
}

export class SpeakDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  patientId?: number;
}

export class RagDebugDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  query!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  topK?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  patientId?: number;
}

export class PatientIdQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  patientId?: number;
}
