// src/calendar/calendar.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { CalendarService } from './calendar.service.js';
import { CalendarController } from './calendar.controller.js';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { CalendarUpdatesService } from './calendar-updates.service.js';

@Module({
  imports: [
    ConfigModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarUpdatesService, JwtAuthGuard],
  exports: [CalendarService],
})
export class CalendarModule {}