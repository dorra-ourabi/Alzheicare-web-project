import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';
import { MailModule } from './mail/mail.module';
import { ChatModule } from './chat/chat.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [UsersModule, AuthModule, CalendarModule, MailModule, ChatModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
