import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationProcessor } from './notification.processor.js';
import { NotificationSchedulerService } from './notification-scheduler.service.js';
import { NotificationService } from './notification.service.js';
import { NOTIFICATIONS_QUEUE } from './notifications.constant.js';
import { MailService } from './providers/mail.service.js';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: '"AlzheiCare" <noreply@alzheicare.com>',
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          const url = new URL(redisUrl);
          return {
            connection: {
              host: url.hostname,
              port: Number(url.port) || 6379,
              username: url.username || undefined,
              password: url.password || undefined,
              db: url.pathname ? Number(url.pathname.slice(1)) : undefined,
              tls: url.protocol === 'rediss:' ? {} : undefined,
            },
          };
        }

        return {
          connection: {
            host: configService.get<string>('REDIS_HOST') || '127.0.0.1',
            port: Number(configService.get<string>('REDIS_PORT')) || 6379,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
  ],
  providers: [MailService, NotificationService, NotificationSchedulerService, NotificationProcessor],
  exports: [MailService, NotificationSchedulerService, NotificationService],
})
export class NotificationsModule {}
