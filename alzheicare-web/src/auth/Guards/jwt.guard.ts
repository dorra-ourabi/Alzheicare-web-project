import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';

function getRequest(context: ExecutionContext): any {
  if (context.getType<'graphql'>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext().req;
  }
  return context.switchToHttp().getRequest();
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = getRequest(context);
    if (this.isBypassEnabled()) {
      request.user = { sub: this.getBypassUserId() };
      return true;
    }

    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ||
          'dev_access_secret',
      });
      request.user = payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return true;
  }

  private isBypassEnabled(): boolean {
    return (
      (this.configService.get<string>('BYPASS_AUTH') || '').toLowerCase() ===
      'true'
    );
  }

  private getBypassUserId(): number {
    const bypassUserId = Number(
      this.configService.get<string>('BYPASS_USER_ID'),
    );
    if (!bypassUserId) {
      throw new UnauthorizedException('Invalid bypass user');
    }
    return bypassUserId;
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}
