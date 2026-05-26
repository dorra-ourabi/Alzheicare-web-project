import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';

import { LoginCredentialsDto } from '../../users/DTOs/LoginCredentialsDto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RefreshTokenDto } from '../DTOs/RefreshTokenDto.js';
import { AuthTokensDto } from '../DTOs/AuthTokenDto.js';
import { AuthResponseDto } from '../DTOs/AuthResponseDto.js';
import { GoogleLoginDto } from '../DTOs/GoogleLoginDto.js';
import { UserRole } from '../../../generated/prisma/client.js';

@Injectable()
export class AuthService {
  private sessions = new Map<string, string>();
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginCredentialsDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new NotFoundException('Invalid username');
    }

    if (!loginDto.password || !user.password) {
      throw new NotFoundException('Invalid username or password.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new NotFoundException('Invalid Password.');
    }

    const sessionId = randomUUID();
    return this.buildAuthResponse(user, sessionId);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
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

    return this.buildAuthResponse(user, sessionId);
  }

  async logout(dto: RefreshTokenDto): Promise<{ success: true }> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    this.sessions.delete(payload.sessionId);
    return { success: true };
  }

  async googleLogin(dto: GoogleLoginDto): Promise<AuthResponseDto> {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new BadRequestException('GOOGLE_CLIENT_ID is not configured');
    }

    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: dto.idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    if (!email) {
      throw new BadRequestException('Google token payload is missing email');
    }

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      const baseUsername = (email.split('@')[0] || 'user').toLowerCase();
      const username = await this.ensureUniqueUsername(baseUsername);
      const firstName =
        payload?.given_name || payload?.name?.split(' ')[0] || 'Google';
      const secondName =
        payload?.family_name ||
        payload?.name?.split(' ').slice(1).join(' ') ||
        'User';
      const hashedPassword = await bcrypt.hash(
        randomBytes(32).toString('hex'),
        10,
      );

      user = await this.prisma.user.create({
        data: {
          username,
          firstName,
          secondName,
          email,
          password: hashedPassword,
          role: UserRole.Patient,
          isEmailVerified: true,
        },
      });
    }

    const sessionId = randomUUID();
    return this.buildAuthResponse(user, sessionId);
  }

  private async buildTokens(
    user: any,
    sessionId: string,
  ): Promise<AuthTokensDto> {
    if (!user.id || !user.username || !user.role) {
      throw new UnauthorizedException(
        'User data incomplete for token generation',
      );
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

  private async buildAuthResponse(
    user: any,
    sessionId: string,
  ): Promise<AuthResponseDto> {
    const tokens = await this.buildTokens(user, sessionId);
    await this.storeRefreshHash(sessionId, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async ensureUniqueUsername(baseUsername: string) {
    let username = baseUsername;
    let suffix = 0;

    while (await this.prisma.user.findUnique({ where: { username } })) {
      suffix += 1;
      username = `${baseUsername}${suffix}`;
    }

    return username;
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ sub: number; sessionId: string }> {
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
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret'
    );
  }

  private refreshSecret() {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'dev_refresh_secret'
    );
  }

  private accessExpires() {
    return 15 * 60;
  }

  private refreshExpires() {
    return 7 * 24 * 60 * 60;
  }
}
