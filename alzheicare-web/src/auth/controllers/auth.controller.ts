import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from '../Services/auth.service.js';
import { LoginCredentialsDto } from '../../users/DTOs/LoginCredentialsDto.js';
import { CreateUserDto } from '../../users/DTOs/createUserDto.js';
import { CreatePatientDto } from '../../users/DTOs/createPatientDto.js';
import { CreateDoctorDto } from '../../users/DTOs/createDoctorDto.js';
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

  @Post('register/patient')
  registerPatient(@Body() dto: CreatePatientDto): Promise<AuthTokensDto> {
    return this.authService.registerPatient(dto);
  }

  @Post('register/doctor')
  registerDoctor(@Body() dto: CreateDoctorDto): Promise<AuthTokensDto> {
    return this.authService.registerDoctor(dto);
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
  verifyEmail(@Query('token') token: string): Promise<AuthTokensDto> {
    return this.authService.verifyEmail(token);
  }
}
