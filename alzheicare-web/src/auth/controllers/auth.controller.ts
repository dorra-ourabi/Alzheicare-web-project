import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../Services/auth.service.js';
import { LoginCredentialsDto } from '../../users/DTOs/LoginCredentialsDto.js';
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
}
