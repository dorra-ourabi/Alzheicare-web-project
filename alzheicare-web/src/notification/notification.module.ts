import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { NotificationController } from './notification.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [PrismaModule, EventEmitterModule.forRoot()],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
