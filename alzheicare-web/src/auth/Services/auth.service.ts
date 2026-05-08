import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';

import { LoginCredentialsDto } from '../../users/DTOs/LoginCredentialsDto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RefreshTokenDto } from '../DTOs/RefreshTokenDto.js';
import { AuthTokensDto } from '../DTOs/AuthTokenDto.js';

@Injectable()
export class AuthService {
  private sessions = new Map<string, string>(); 
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginCredentialsDto): Promise<AuthTokensDto> {
    const user = await this.prisma.user.findUnique({ where: { username: loginDto.username } });

    if (!user) {
      throw new NotFoundException('Invalid username');
    }

    if (!loginDto.password || !user.password) {
      throw new NotFoundException('Invalid username or password.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new NotFoundException('Invalid Password.');
    }

    const sessionId = randomUUID();
    const tokens = await this.buildTokens(user, sessionId);

    await this.storeRefreshHash(sessionId, tokens.refreshToken);

    return tokens;
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    const sessionId = payload.sessionId;
    const userId = payload.sub;

    const storedHash = this.sessions.get(sessionId);
    if (!storedHash || storedHash !== this.hashToken(dto.refreshToken)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.buildTokens(user, sessionId);
    await this.storeRefreshHash(sessionId, tokens.refreshToken);

    return tokens;
  }

  async logout(dto: RefreshTokenDto): Promise<{ success: true }> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    this.sessions.delete(payload.sessionId);
    return { success: true };
  }

  private async buildTokens(user: any, sessionId: string): Promise<AuthTokensDto> {
    if (!user.id || !user.username || !user.role) {
      throw new UnauthorizedException('User data incomplete for token generation');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        sessionId,
      },
      {
        secret: this.accessSecret(),
        expiresIn: this.accessExpires(),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        sessionId,
      },
      {
        secret: this.refreshSecret(),
        expiresIn: this.refreshExpires(),
      },
    );

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<{ sub: number; sessionId: string }> {
    try {
      return await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async storeRefreshHash(sessionId: string, refreshToken: string) {
    this.sessions.set(sessionId, this.hashToken(refreshToken));
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private accessSecret() {
    return this.configService.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret';
  }

  private refreshSecret() {
    return this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev_refresh_secret';
  }

  private accessExpires() {
    return 15 * 60; 
  }

  private refreshExpires() {
    return 7 * 24 * 60 * 60; 
  }
}