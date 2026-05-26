import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TelegramService } from './telegram.service.js';

@Module({
  imports: [PrismaModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
