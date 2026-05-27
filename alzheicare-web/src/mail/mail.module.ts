import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service.js';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      transport: {
        host: config.get<string>('MAIL_HOST') ?? 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: config.get<string>('MAIL_USER'),
          pass: config.get<string>('MAIL_PASS'),
        },
      },
      defaults: {
        from: '"AlzheiCare" <noreply@alzheicare.com>',
      },
    }),
  }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
