import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { InvitationModule } from './invitation/invitation.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CalendarModule } from './calendar/calendar.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { MailModule } from './mail/mail.module.js';
import { TelegramModule } from './telegram/telegram.module.js';
import { ChatModule } from './chat/chat.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { NotificationModule } from './notification/notification.module.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StripeModule } from './stripe/stripe.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    InvitationModule,
    NotificationModule,
    CalendarModule,
    NotificationsModule,
    MailModule,
    TelegramModule,
    ChatModule,
    DashboardModule,
    EventEmitterModule.forRoot(),
    StripeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
