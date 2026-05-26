import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service.js';

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
  ],
  providers: [MailService],
  exports: [MailService, MailerModule],
})
export class MailModule {}
