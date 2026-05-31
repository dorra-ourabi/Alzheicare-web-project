import { Type } from 'class-transformer';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UpdateCurrentPositionDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  updatedAt?: string;
}

export class UpdateUserLocationDto {
  @IsString()
  @IsOptional()
  address?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => UpdateCurrentPositionDto)
  @IsOptional()
  currentPosition?: UpdateCurrentPositionDto;
}