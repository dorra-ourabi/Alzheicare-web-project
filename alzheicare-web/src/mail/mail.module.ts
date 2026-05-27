import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { join } from 'path';
import { MailService } from './mail.service.js';

const templateDir = (() => {
  const distPath = join(process.cwd(), 'dist', 'src', 'mail', 'templates');
  if (existsSync(distPath)) return distPath;
  return join(process.cwd(), 'src', 'mail', 'templates');
})();

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const user = config.get<string>('MAIL_USER');
        const pass = config.get<string>('MAIL_PASS');
        if (!user || !pass) {
          throw new Error('MAIL_USER and MAIL_PASS must be set');
        }

        return {
          transport: {
            host: config.get<string>('MAIL_HOST') || 'smtp.gmail.com',
            port: Number(config.get<string>('MAIL_PORT') || 587),
            secure: false,
            auth: { user, pass },
          },
          defaults: {
            from: config.get<string>('MAIL_FROM') || '"AlzheiCare" <noreply@alzheicare.com>',
          },
          template: {
            dir: templateDir,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
