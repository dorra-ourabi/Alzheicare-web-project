import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from '../Services/auth.service.js';
import { LoginCredentialsDto } from '../../users/DTOs/LoginCredentialsDto.js';
import { CreateUserDto } from '../../users/DTOs/createUserDto.js';
import { RefreshTokenDto } from '../DTOs/RefreshTokenDto.js';
import { AuthTokensDto } from '../DTOs/AuthTokenDto.js';
import { AuthGoogleLoginDto } from '../DTOs/AuthGoogleLoginDto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginCredentialsDto): Promise<AuthTokensDto> {
    return this.authService.login(dto);
  }

  @Post('register')
  register(@Body() dto: CreateUserDto): Promise<AuthTokensDto> {
    return this.authService.register(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto): Promise<{ success: true }> {
    return this.authService.logout(dto);
  }
  @Post('google-login')
  googleLogin(@Body() dto: AuthGoogleLoginDto): Promise<AuthTokensDto> {
    return this.authService.googleLogin(dto);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string): Promise<{ success: true }> {
    return this.authService.verifyEmail(token);
  }
}
