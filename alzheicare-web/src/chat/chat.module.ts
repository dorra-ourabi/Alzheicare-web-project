import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  
  imports: [PrismaModule, AuthModule, MailModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}