import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../Services/auth.service.js';
import { LoginCredentialsDto } from '../../users/DTOs/LoginCredentialsDto.js';
import { RefreshTokenDto } from '../DTOs/RefreshTokenDto.js';
import { AuthResponseDto } from '../DTOs/AuthResponseDto.js';
import { GoogleLoginDto } from '../DTOs/GoogleLoginDto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginCredentialsDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto): Promise<{ success: true }> {
    return this.authService.logout(dto);
  }
}

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: GoogleLoginDto): Promise<AuthResponseDto> {
    return this.authService.googleLogin(dto);
  }
}