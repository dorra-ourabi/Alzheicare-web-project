import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';

import { LoginCredentialsDto } from '../../users/DTOs/LoginCredentialsDto.js';
import { CreateUserDto } from '../../users/DTOs/createUserDto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RefreshTokenDto } from '../DTOs/RefreshTokenDto.js';
import { AuthTokensDto } from '../DTOs/AuthTokenDto.js';
import { RedisService } from './redis.service.js';
import { AuthGoogleLoginDto } from '../DTOs/AuthGoogleLoginDto.js';
import { AuthGoogleService } from './googleAuthservice.js';
import { UserRole } from '../../../generated/prisma/client.js';
import { MailService } from '../../mail/mail.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly authGoogleService: AuthGoogleService,
    private readonly mailService: MailService,
  ) {}
  //this funnctioon returns double tokens (access and refresh) when the user logs in with his credentials
  async login(loginDto: LoginCredentialsDto): Promise<AuthTokensDto> {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new NotFoundException('Invalid user');
    }

    if (!loginDto.password || !user.password) {
      throw new UnauthorizedException('provide a password!');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (!user.isEmailVerified) {
      const now = new Date();
      let token = user.emailVerificationToken;
      let expiresAt = user.emailVerificationExpiresAt;

      if (!token || !expiresAt || expiresAt <= now) {
        token = randomBytes(32).toString('hex');
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationToken: token,
            emailVerificationExpiresAt: expiresAt,
          },
        });
      }

      await this.mailService.sendVerificationEmail(user, token);
      throw new UnauthorizedException('Email not verified');
    }

    const sessionId = randomUUID();
    const tokens = await this.buildTokens(user, sessionId);

    await this.storeRefreshHash(sessionId, tokens.refreshToken);

    return tokens;
  }

  async googleLogin(loginDto: AuthGoogleLoginDto): Promise<AuthTokensDto> {
    const profile = await this.authGoogleService.getProfileByToken(loginDto);

    if (!profile.email) {
      throw new UnauthorizedException('Google account has no email');
    }

    let user = await this.prisma.user.findFirst({
      where: { email: profile.email, deletedAt: null },
    });

    if (!user) {
      const username = await this.generateUniqueUsername(profile.email);
      const passwordHash = await bcrypt.hash(
        randomBytes(32).toString('hex'),
        10,
      );

      user = await this.prisma.user.create({
        data: {
          username,
          firstName: profile.firstName || 'Google',
          secondName: profile.lastName || 'User',
          email: profile.email,
          password: passwordHash,
          role: UserRole.Patient,
          isEmailVerified: true,
        },
      });
    }

    const sessionId = randomUUID();
    const tokens = await this.buildTokens(user, sessionId);
    await this.storeRefreshHash(sessionId, tokens.refreshToken);

    return tokens;
  }

  async register(dto: CreateUserDto): Promise<AuthTokensDto> {
    if (!dto.password) {
      throw new BadRequestException('Password is required');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: dto.email }, { username: dto.username }],
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(
        'Email already exists or username already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        firstName: dto.firstName,
        secondName: dto.secondName,
        email: dto.email,
        password: hashedPassword,
        role: dto.role || UserRole.Patient,
        emailVerificationToken,
        emailVerificationExpiresAt,
        isEmailVerified: false,
      },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        firstName: true,
      },
    });

    await this.mailService.sendVerificationEmail(user, emailVerificationToken);

    const sessionId = randomUUID();
    const tokens = await this.buildTokens(user, sessionId);
    await this.storeRefreshHash(sessionId, tokens.refreshToken);

    return tokens;
  }

  async verifyEmail(token: string): Promise<{ success: true }> {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { success: true };
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    const sessionId = payload.sessionId;
    const userId = payload.sub;

    const sessionKey = this.sessionKey(sessionId);
    const [storedHash, ttlSeconds] = await Promise.all([
      this.redisService.get(sessionKey),
      this.redisService.ttl(sessionKey),
    ]);

    if (!storedHash || ttlSeconds <= 0) {
      await this.redisService.del(sessionKey);
      throw new UnauthorizedException('Session expired');
    }

    if (storedHash !== this.hashToken(dto.refreshToken)) {
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
    try {
      const payload = await this.verifyRefreshToken(dto.refreshToken);
      await this.redisService.del(this.sessionKey(payload.sessionId));
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        throw error;
      }
    }
    return { success: true };
  }

  private async buildTokens(
    user: any,
    sessionId: string,
  ): Promise<AuthTokensDto> {
    if (!user.id || !user.username || !user.role) {
      throw new UnauthorizedException('Uauthorized');
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

  async verifyAccessToken(token: string): Promise<{ sub: number; username: string; role: UserRole; sessionId: string }> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.accessSecret(), 
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async verifyEmail(token: string): Promise<{ success: true }> {
    const now = new Date();
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: { gt: now },
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { success: true };
  }

  private async storeRefreshHash(sessionId: string, refreshToken: string) {
    const ttlSeconds = this.refreshExpires();
    await this.redisService.set(
      this.sessionKey(sessionId),
      this.hashToken(refreshToken),
      ttlSeconds,
    );
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    const base = email.split('@')[0]?.toLowerCase() || 'user';
    const sanitized = base.replace(/[^a-z0-9._-]/g, '') || 'user';

    let candidate = sanitized;
    let suffix = 1;

    while (
      await this.prisma.user.findUnique({ where: { username: candidate } })
    ) {
      candidate = `${sanitized}${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private sessionKey(sessionId: string) {
    return `session:${sessionId}`;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private accessSecret() {
    return this.configService.get<string>('JWT_ACCESS_SECRET');
  }

  private refreshSecret() {
    return this.configService.get<string>('JWT_REFRESH_SECRET');
  }

  private accessExpires() {
    return 15 * 60;
  }

  private refreshExpires() {
    return 7 * 24 * 60 * 60;
  }
}
