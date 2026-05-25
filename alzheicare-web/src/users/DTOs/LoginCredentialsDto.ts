import { IsNotEmpty, IsString } from 'class-validator';

export class LoginCredentialsDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
