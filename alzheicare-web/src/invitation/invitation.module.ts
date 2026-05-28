import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { InvitationService } from './invitation.service.js';
import { InvitationController } from './invitation.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MailModule } from '../mail/mail.module.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { RolesGuard } from '../auth/Guards/roles.guard.js';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    EventEmitterModule.forRoot(),
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [InvitationService, JwtAuthGuard, RolesGuard],
  controllers: [InvitationController],
})
export class InvitationModule {}
