import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AuthResponseUserDto {
  @IsNumber()
  id!: number;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  role!: string;
}

export class AuthResponseDto {
  @IsString()
  @IsNotEmpty()
  accessToken!: string;

  @IsString()
  @IsNotEmpty()
  refreshToken!: string;

  user!: AuthResponseUserDto;
}
