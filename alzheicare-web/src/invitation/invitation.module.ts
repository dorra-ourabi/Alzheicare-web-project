import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service.js';
import { InvitationController } from './invitation.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MailModule } from '../mail/mail.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    AuthModule,
  ],
  providers: [InvitationService],
  controllers: [InvitationController],
})
export class InvitationModule {}