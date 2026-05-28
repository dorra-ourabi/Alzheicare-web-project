import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AuthTokensDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  accessToken!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  refreshToken!: string;
}