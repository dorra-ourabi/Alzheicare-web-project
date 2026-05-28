import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UserController } from './Controllers/user.controller.js';
import { UserService } from './Services/user.service.js';
import { MailModule } from '../mail/mail.module.js';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { RolesGuard } from '../auth/Guards/roles.guard.js';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_secret',
      signOptions: { expiresIn: '1h' },
    }),
    MailModule,
  ],
  controllers: [UserController],
  providers: [UserService, JwtAuthGuard, RolesGuard],
  exports: [UserService],
})
export class UsersModule {}
