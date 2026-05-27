import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from '../mail/mail.module.js';
import { JwtModule } from '@nestjs/jwt';
import { NotificationProcessor } from './notification.processor.js';
import { NotificationSchedulerService } from './notification-scheduler.service.js';
import { NotificationService } from './notification.service.js';
import { NOTIFICATIONS_QUEUE } from './notifications.constant.js';
import { NotificationsController } from './notifications.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret',
        signOptions: { expiresIn: '15m' },
      }),
    }),
    MailModule,
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
  controllers: [NotificationsController],
  providers: [NotificationService, NotificationSchedulerService, NotificationProcessor],
  exports: [NotificationSchedulerService, NotificationService],
})
export class NotificationsModule {}
