import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GeofenceAlertDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  homeAddress?: string;

  @IsString()
  @IsOptional()
  updatedAt?: string;
}
