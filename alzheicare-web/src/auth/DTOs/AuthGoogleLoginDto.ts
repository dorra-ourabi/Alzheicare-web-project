import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/client.js';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthGoogleLoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  idToken!: string;

  @ApiProperty({ required: false, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
