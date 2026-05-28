// src/calendar/calendar.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CalendarService } from './calendar.service.js';
import { CreateCalendarEventDto } from './DTOs/CreateCalendarEventDto.js';
import { UpdateCalendarEventDto } from './DTOs/UpdateCalendarEventDto.js';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { CalendarUpdatesService } from './calendar-updates.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { interval, map, merge } from 'rxjs';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly updatesService: CalendarUpdatesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth/url')
  async googleAuthUrl(@Req() req: any) {
    const userId = this.getUserId(req);
    const role = req.user?.role;
    const url = await this.calendarService.getAuthUrl(userId, role);
    return { url };
  }

  @Get('auth/callback')
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: any) {
    const { role } = await this.calendarService.handleCallback(code, state);
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const roleSlug = role?.toString().toLowerCase().includes('doctor') ? 'doctor' : 'caregiver';
    return res.redirect(`${frontendBase}/${roleSlug}/calendar?google=connected`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('events')
  async getEvents(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.calendarService.getUpcomingEvents(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('events')
  async createEvent(@Body() createDto: CreateCalendarEventDto, @Req() req: any) {
    const userId = this.getUserId(req);
    return this.calendarService.createEvent(userId, createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('events/local')
  async getLocalEvents(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.calendarService.getLocalEvents(userId);
  }

  @Sse('events/stream')
  streamEvents(@Query('token') token?: string) {
    const userId = this.resolveStreamUserId(token);

    const updates$ = this.updatesService
      .subscribe(userId)
      .pipe(map((event) => ({ data: event })));
    const keepAlive$ = interval(25000)
      .pipe(map(() => ({ data: { type: 'ping', timestamp: Date.now() } })));

    return merge(updates$, keepAlive$);
  }

  @UseGuards(JwtAuthGuard)
  @Post('webhook/watch')
  async registerWebhook(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.calendarService.registerGoogleWebhook(userId);
  }

  @Post('webhook')
  async handleWebhook(@Req() req: any) {
    return this.calendarService.handleGoogleWebhook(req.headers ?? {});
  }

  @UseGuards(JwtAuthGuard)
  @Patch('events/:id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateDto: UpdateCalendarEventDto,
    @Query('scope') scope: 'single' | 'series' = 'single',
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);
    return this.calendarService.updateEvent(userId, id, updateDto, scope);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('events/:id')
  async deleteEvent(
    @Param('id') id: string,
    @Query('scope') scope: 'single' | 'series' = 'single',
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);
    return this.calendarService.deleteEvent(userId, id, scope);
  }

  private getUserId(req: any): number {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return Number(userId);
  }

  private resolveStreamUserId(token?: string) {
    if (this.isBypassEnabled()) {
      const bypassUserId = Number(this.configService.get<string>('BYPASS_USER_ID'));
      if (!bypassUserId) {
        throw new UnauthorizedException('Invalid bypass user');
      }
      return bypassUserId;
    }

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const secret = this.configService.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret';
    let payload: any;
    try {
      payload = this.jwtService.verify(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const userId = Number(payload?.sub);
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    return userId;
  }

  private isBypassEnabled() {
    return (this.configService.get<string>('BYPASS_AUTH') || '').toLowerCase() === 'true';
  }
}