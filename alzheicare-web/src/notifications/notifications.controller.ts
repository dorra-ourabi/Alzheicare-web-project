import {
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { map, type Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { NotificationService } from './notification.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private notifications: NotificationService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: any) {
    return this.notifications.listForUser(this.userIdFromRequest(req));
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    return this.notifications.getUnreadCount(this.userIdFromRequest(req));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.notifications.markAllRead(this.userIdFromRequest(req));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markRead(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.notifications.markRead(this.userIdFromRequest(req), id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.notifications.delete(this.userIdFromRequest(req), id);
  }

  @Sse('stream')
  stream(
    @Query('token') token: string | undefined,
    @Req() req: any,
  ): Observable<MessageEvent> {
    const userId = this.resolveUserId(req, token);
    return this.notifications
      .subscribe(userId)
      .pipe(map((payload) => ({ data: payload })));
  }

  private userIdFromRequest(req: any) {
    const userId = Number(req?.user?.sub);
    if (!userId) {
      throw new UnauthorizedException('Invalid user credentials');
    }
    return userId;
  }

  private resolveUserId(req: any, token?: string) {
    if (this.isBypassEnabled()) {
      const bypassUserId = Number(
        this.configService.get<string>('BYPASS_USER_ID'),
      );
      if (!bypassUserId) {
        throw new UnauthorizedException('Invalid bypass user');
      }
      return bypassUserId;
    }

    const authHeader = req?.headers?.authorization;
    const headerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;
    const rawToken = token || headerToken;
    if (!rawToken) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(rawToken, {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ||
          'dev_access_secret',
      });
      const userId = Number(payload?.sub);
      if (!userId) {
        throw new UnauthorizedException('Invalid token payload');
      }
      return userId;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private isBypassEnabled() {
    return (
      (this.configService.get<string>('BYPASS_AUTH') || '').toLowerCase() ===
      'true'
    );
  }
}
