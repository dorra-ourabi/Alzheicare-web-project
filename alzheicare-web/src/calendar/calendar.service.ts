// src/calendar/calendar.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
import type { Credentials, OAuth2Client } from 'google-auth-library';
import { addDays } from 'date-fns';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CalendarEvent, Prisma, User } from '../../generated/prisma/client.js';
import { CreateCalendarEventDto } from './DTOs/CreateCalendarEventDto.js';
import { UpdateCalendarEventDto } from './DTOs/UpdateCalendarEventDto.js';
import { NotificationSchedulerService } from '../notifications/notification-scheduler.service.js';
import { CalendarUpdatesService } from './calendar-updates.service.js';


@Injectable()
export class CalendarService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationScheduler: NotificationSchedulerService,
    private updatesService: CalendarUpdatesService,
  ) {}

  getOAuthClient(): OAuth2Client {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  async getAuthUrl(userId: number, role?: string) {
    const oauth2Client = this.getOAuthClient();
    const state = await this.buildOauthState(userId, role);
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      state,
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ tokens: Credentials; userId: number; role?: string }> {
    const oauth2Client = this.getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    const payload = await this.verifyOauthState(state);

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const nextAccessToken = tokens.access_token ?? user.googleAccessToken;
    const nextRefreshToken = tokens.refresh_token ?? user.googleRefreshToken;

    if (!nextAccessToken || !nextRefreshToken) {
      throw new BadRequestException('Unable to obtain Google Calendar tokens');
    }

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: {
        googleAccessToken: nextAccessToken,
        googleRefreshToken: nextRefreshToken,
      },
    });

    try {
      await this.registerGoogleWebhook(payload.sub);
    } catch (error) {
      // Do not block login if webhook registration fails.
      console.warn('Google webhook registration skipped:', error instanceof Error ? error.message : error);
    }

    return { tokens, userId: payload.sub, role: payload.role };
  }

  async registerGoogleWebhook(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.googleAccessToken || !user.googleRefreshToken) {
      throw new BadRequestException('Google Calendar is not connected for this user');
    }

    const webhookUrl = this.configService.get<string>('GOOGLE_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new BadRequestException('GOOGLE_WEBHOOK_URL is not configured');
    }

    const oauth2Client = this.getOAuthClient();
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const channelId = randomUUID();

    const watchResponse = await calendar.events.watch({
      calendarId: 'primary',
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleCalendarChannelId: channelId,
        googleCalendarResourceId: watchResponse.data.resourceId ?? null,
        googleCalendarChannelExpiresAt: watchResponse.data.expiration
          ? Number(watchResponse.data.expiration)
          : null,
      },
    });

    return {
      channelId,
      resourceId: watchResponse.data.resourceId,
      expiration: watchResponse.data.expiration,
    };
  }

  async handleGoogleWebhook(headers: Record<string, string | string[] | undefined>) {
    const channelId = this.getHeaderValue(headers, 'x-goog-channel-id');
    const resourceId = this.getHeaderValue(headers, 'x-goog-resource-id');
    const resourceState = this.getHeaderValue(headers, 'x-goog-resource-state');

    if (!channelId || !resourceId) {
      return { handled: false };
    }

    if (resourceState === 'sync') {
      return { handled: true };
    }

    const user = await this.prisma.user.findFirst({
      where: {
        googleCalendarChannelId: channelId,
        googleCalendarResourceId: resourceId,
      },
    });

    if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
      return { handled: false };
    }

    const oauth2Client = this.getOAuthClient();
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const listParams: any = {
      calendarId: 'primary',
      singleEvents: true,
      showDeleted: true,
      maxResults: 250,
    };

    if (user.googleCalendarSyncToken) {
      listParams.syncToken = user.googleCalendarSyncToken;
    } else {
      listParams.timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const listResponse = await calendar.events.list(listParams);
    const nextSyncToken = listResponse.data.nextSyncToken ?? null;
    const items = listResponse.data.items ?? [];

    if (nextSyncToken) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { googleCalendarSyncToken: nextSyncToken },
      });
    }

    if (items.length > 0) {
      await this.syncGoogleEvents(user, items);
    }

    this.updatesService.emit(user.id!, 'google');

    return { handled: true, items };
  }

  private async syncGoogleEvents(user: User, items: Array<calendar_v3.Schema$Event>) {
    const validItems = items.filter((item) => Boolean(item.id));
    if (validItems.length === 0) {
      return;
    }

    const googleIds = validItems.map((item) => item.id!)
    const existingEvents = await this.prisma.calendarEvent.findMany({
      where: {
        googleEventId: { in: googleIds },
        userId: user.id,
      },
    });

    const existingByGoogleId = new Map(
      existingEvents.map((event) => [event.googleEventId!, event]),
    );

    for (const item of validItems) {
      if (item.status === 'cancelled') {
        const existing = existingByGoogleId.get(item.id!);
        if (existing) {
          await this.notificationScheduler.cancelEventNotification(existing.id);
          await this.prisma.calendarEvent.delete({ where: { id: existing.id } });
        }
        continue;
      }

      const parsed = this.parseGoogleEventTimes(item);
      if (!parsed) {
        continue;
      }

      const { startTime, endTime } = parsed;
      const title = item.summary || 'Untitled Google Event';
      const description = item.description ?? undefined;

      const existing = existingByGoogleId.get(item.id!);
      if (existing) {
        const timeChanged =
          existing.startTime.getTime() !== startTime.getTime() ||
          existing.endTime.getTime() !== endTime.getTime();

        const saved = await this.prisma.calendarEvent.update({
          where: { id: existing.id },
          data: {
            title,
            description,
            startTime,
            endTime,
            seriesId: item.recurringEventId ?? existing.seriesId ?? undefined,
            notificationSent: timeChanged ? false : existing.notificationSent,
          },
        });
        await this.notificationScheduler.rescheduleEventNotification(saved);
        continue;
      }

      const saved = await this.prisma.calendarEvent.create({
        data: {
          title,
          description,
          startTime,
          endTime,
          googleEventId: item.id!,
          notifyBefore: 30,
          notificationSent: false,
          category: 'appointment',
          repeatDaily: false,
          repeatUntil: undefined,
          seriesId: item.recurringEventId ?? undefined,
          user: { connect: { id: user.id } },
        },
      });
      await this.notificationScheduler.scheduleEventNotification(saved);
    }
  }

  private parseGoogleEventTimes(event: calendar_v3.Schema$Event) {
    const startRaw = event.start?.dateTime ?? event.start?.date;
    const endRaw = event.end?.dateTime ?? event.end?.date;
    if (!startRaw) {
      return null;
    }

    const startTime = new Date(startRaw);
    const endTime = endRaw ? new Date(endRaw) : startTime;

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return null;
    }

    return { startTime, endTime };
  }

  private getHeaderValue(headers: Record<string, string | string[] | undefined>, key: string) {
    const value = headers[key] ?? headers[key.toLowerCase()];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  async getUpcomingEvents(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.googleAccessToken || !user.googleRefreshToken) {
      throw new BadRequestException('Google Calendar is not connected for this user');
    }

    const now = Date.now();
    const channelExpiresAt = user.googleCalendarChannelExpiresAt ?? 0;
    const shouldRenewChannel =
      !user.googleCalendarChannelId ||
      !user.googleCalendarResourceId ||
      channelExpiresAt <= now + 5 * 60 * 1000;

    if (shouldRenewChannel) {
      try {
        await this.registerGoogleWebhook(userId);
      } catch (error) {
        console.warn('Google webhook refresh skipped:', error instanceof Error ? error.message : error);
      }
    }

    const oauth2Client = this.getOAuthClient();
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 20,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return res.data.items;
    } catch (error) {
      throw new BadRequestException('Failed to fetch Google Calendar events');
    }
  }

  async getLocalEvents(userId: number) {
    return this.prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: 'asc' },
    });
  }

  async createEvent(userId: number, createDto: CreateCalendarEventDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasGoogleTokens = Boolean(user.googleAccessToken && user.googleRefreshToken);

    const startTime = new Date(createDto.startTime);
    const endTime = new Date(createDto.endTime);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const repeatDaily = createDto.repeatDaily ?? false;
    const repeatUntilRaw = createDto.repeatUntil ? new Date(createDto.repeatUntil) : undefined;
    if (repeatDaily && !repeatUntilRaw) {
      throw new BadRequestException('Repeat until date is required for daily repeats');
    }

    if (repeatUntilRaw && Number.isNaN(repeatUntilRaw.getTime())) {
      throw new BadRequestException('Invalid repeat until date');
    }

    const repeatUntil = repeatUntilRaw
      ? new Date(repeatUntilRaw.getFullYear(), repeatUntilRaw.getMonth(), repeatUntilRaw.getDate(), 23, 59, 59, 999)
      : undefined;

    if (repeatUntil && repeatUntil < startTime) {
      throw new BadRequestException('Repeat until must be on or after the start date');
    }

    const durationMs = endTime.getTime() - startTime.getTime();
    const occurrences = repeatDaily && repeatUntil
      ? this.buildDailyOccurrences(startTime, durationMs, repeatUntil)
      : [{ start: startTime, end: endTime }];

    if (occurrences.length > 366) {
      throw new BadRequestException('Too many daily occurrences requested');
    }
    const oauth2Client = hasGoogleTokens ? this.getOAuthClient() : null;
    if (oauth2Client) {
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });
    }

    const calendar = oauth2Client ? google.calendar({ version: 'v3', auth: oauth2Client }) : null;
    const events: Prisma.CalendarEventCreateInput[] = [];
    const seriesId = repeatDaily ? createDto.seriesId ?? randomUUID() : undefined;

    for (const occurrence of occurrences) {
      let googleEventId: string | undefined;
      if (calendar) {
        const insertResponse = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: createDto.title,
            description: createDto.description,
            start: { dateTime: occurrence.start.toISOString() },
            end: { dateTime: occurrence.end.toISOString() },
          },
        });
        googleEventId = insertResponse.data.id ?? undefined;
      }

      const event: Prisma.CalendarEventCreateInput = {
        title: createDto.title,
        description: createDto.description,
        startTime: occurrence.start,
        endTime: occurrence.end,
        googleEventId,
        notifyBefore: createDto.notifyBefore ?? 30,
        notificationSent: false,
        category: createDto.category ?? 'appointment',
        repeatDaily,
        repeatUntil,
        seriesId,
        user: { connect: { id: user.id } },
      };
      events.push(event);
    }

    const savedEvents = await this.prisma.$transaction(
      events.map((data) => this.prisma.calendarEvent.create({ data })),
    );

    for (const event of savedEvents) {
      await this.notificationScheduler.scheduleEventNotification(event);
    }

    this.updatesService.emit(userId, 'local');

    return savedEvents;
  }

  private buildDailyOccurrences(startTime: Date, durationMs: number, repeatUntil: Date) {
    const occurrences: { start: Date; end: Date }[] = [];
    let cursor = new Date(startTime);

    while (cursor <= repeatUntil) {
      occurrences.push({
        start: new Date(cursor),
        end: new Date(cursor.getTime() + durationMs),
      });
      cursor = addDays(cursor, 1);
    }

    return occurrences;
  }

  async updateEvent(
    userId: number,
    eventId: string,
    updateDto: UpdateCalendarEventDto,
    scope: 'single' | 'series' = 'single',
  ) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== userId) {
      throw new NotFoundException('Event not found');
    }

    const startTime = updateDto.startTime ? new Date(updateDto.startTime) : event.startTime;
    const endTime = updateDto.endTime ? new Date(updateDto.endTime) : event.endTime;

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    if (scope === 'series' && event.seriesId) {
      const seriesEvents = await this.prisma.calendarEvent.findMany({
        where: { seriesId: event.seriesId, userId },
        orderBy: { startTime: 'asc' },
      });

      const updatedSeries = await this.updateSeriesEvents(seriesEvents, updateDto, userId);
      this.updatesService.emit(userId, 'local');
      return updatedSeries;
    }

    const updatedEvent = await this.updateSingleEvent(event, updateDto, userId, startTime, endTime);
    this.updatesService.emit(userId, 'local');
    return updatedEvent;
  }

  async deleteEvent(userId: number, eventId: string, scope: 'single' | 'series' = 'single') {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== userId) {
      throw new NotFoundException('Event not found');
    }

    if (scope === 'series' && event.seriesId) {
      const seriesEvents = await this.prisma.calendarEvent.findMany({
        where: { seriesId: event.seriesId, userId },
      });

      await this.deleteSeriesEvents(seriesEvents, userId);
      this.updatesService.emit(userId, 'local');
      return { deleted: true, deletedCount: seriesEvents.length };
    }

    await this.deleteSingleEvent(event, userId);
    this.updatesService.emit(userId, 'local');
    return { deleted: true, deletedCount: 1 };
  }

  private async updateSeriesEvents(
    events: CalendarEvent[],
    updateDto: UpdateCalendarEventDto,
    userId: number,
  ) {
    const hasTimeUpdate = Boolean(updateDto.startTime || updateDto.endTime);
    const startTime = updateDto.startTime ? new Date(updateDto.startTime) : undefined;
    const endTime = updateDto.endTime ? new Date(updateDto.endTime) : undefined;

    if ((startTime && Number.isNaN(startTime.getTime())) || (endTime && Number.isNaN(endTime.getTime()))) {
      throw new BadRequestException('Invalid start or end time');
    }

    if (startTime && endTime && endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const calendarClient = await this.getCalendarClient(userId);

    const updates: Prisma.PrismaPromise<CalendarEvent>[] = [];

    for (const event of events) {
      const nextStart = hasTimeUpdate && startTime
        ? this.mergeDateAndTime(event.startTime, startTime)
        : event.startTime;
      const nextEnd = hasTimeUpdate && endTime
        ? this.mergeDateAndTime(event.endTime, endTime)
        : event.endTime;

      if (nextEnd <= nextStart) {
        throw new BadRequestException('End time must be after start time');
      }

      if (event.googleEventId && calendarClient) {
        await calendarClient.events.patch({
          calendarId: 'primary',
          eventId: event.googleEventId,
          requestBody: {
            ...(updateDto.title ? { summary: updateDto.title } : {}),
            ...(updateDto.description !== undefined ? { description: updateDto.description } : {}),
            ...(hasTimeUpdate ? { start: { dateTime: nextStart.toISOString() } } : {}),
            ...(hasTimeUpdate ? { end: { dateTime: nextEnd.toISOString() } } : {}),
          },
        });
      }

      updates.push(
        this.prisma.calendarEvent.update({
          where: { id: event.id },
          data: {
            title: updateDto.title ?? event.title,
            description: updateDto.description ?? event.description,
            startTime: nextStart,
            endTime: nextEnd,
            ...(updateDto.notifyBefore !== undefined ? { notifyBefore: updateDto.notifyBefore } : {}),
            ...(updateDto.category ? { category: updateDto.category } : {}),
          },
        }),
      );
    }

    const savedEvents = await this.prisma.$transaction(updates);

    for (const savedEvent of savedEvents) {
      await this.notificationScheduler.rescheduleEventNotification(savedEvent);
    }

    return savedEvents;
  }

  private async updateSingleEvent(
    event: CalendarEvent,
    updateDto: UpdateCalendarEventDto,
    userId: number,
    startTime: Date,
    endTime: Date,
  ) {
    const calendarClient = await this.getCalendarClient(userId);

    if (event.googleEventId && calendarClient) {
      await calendarClient.events.patch({
        calendarId: 'primary',
        eventId: event.googleEventId,
        requestBody: {
          ...(updateDto.title ? { summary: updateDto.title } : {}),
          ...(updateDto.description !== undefined ? { description: updateDto.description } : {}),
          ...(updateDto.startTime ? { start: { dateTime: startTime.toISOString() } } : {}),
          ...(updateDto.endTime ? { end: { dateTime: endTime.toISOString() } } : {}),
        },
      });
    }

    const savedEvent = await this.prisma.calendarEvent.update({
      where: { id: event.id },
      data: {
        title: updateDto.title ?? event.title,
        description: updateDto.description ?? event.description,
        startTime,
        endTime,
        ...(updateDto.notifyBefore !== undefined ? { notifyBefore: updateDto.notifyBefore } : {}),
        ...(updateDto.category ? { category: updateDto.category } : {}),
      },
    });

    await this.notificationScheduler.rescheduleEventNotification(savedEvent);

    return savedEvent;
  }

  private async deleteSeriesEvents(events: CalendarEvent[], userId: number) {
    const calendarClient = await this.getCalendarClient(userId);

    for (const event of events) {
      if (event.googleEventId && calendarClient) {
        await calendarClient.events.delete({
          calendarId: 'primary',
          eventId: event.googleEventId,
        });
      }

      await this.notificationScheduler.cancelEventNotification(event.id);
    }

    const ids = events.map((event) => event.id);
    if (ids.length > 0) {
      await this.prisma.calendarEvent.deleteMany({ where: { id: { in: ids } } });
    }
  }

  private async deleteSingleEvent(event: CalendarEvent, userId: number) {
    const calendarClient = await this.getCalendarClient(userId);

    if (event.googleEventId && calendarClient) {
      await calendarClient.events.delete({
        calendarId: 'primary',
        eventId: event.googleEventId,
      });
    }

    await this.notificationScheduler.cancelEventNotification(event.id);

    await this.prisma.calendarEvent.delete({ where: { id: event.id } });
  }

  private async getCalendarClient(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.googleAccessToken || !user.googleRefreshToken) {
      return null;
    }

    const oauth2Client = this.getOAuthClient();
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  private async buildOauthState(userId: number, role?: string) {
    return this.jwtService.signAsync(
      { sub: userId, role, purpose: 'calendar_oauth' },
      { secret: this.accessSecret(), expiresIn: '10m' },
    );
  }

  private async verifyOauthState(state: string): Promise<{ sub: number; role?: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(state, { secret: this.accessSecret() });
      if (payload?.purpose !== 'calendar_oauth' || !payload?.sub) {
        throw new BadRequestException('Invalid OAuth state');
      }
      return { sub: Number(payload.sub), role: payload.role };
    } catch {
      throw new BadRequestException('Invalid OAuth state');
    }
  }

  private accessSecret() {
    return this.configService.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret';
  }

  private mergeDateAndTime(date: Date, timeSource: Date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      timeSource.getHours(),
      timeSource.getMinutes(),
      timeSource.getSeconds(),
      timeSource.getMilliseconds(),
    );
  }
}