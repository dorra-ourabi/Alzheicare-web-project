import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface CreateMessageInput {
  threadUserId: number;
  senderId: number;
  senderRole: string;
  content: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(input: CreateMessageInput) {
    return this.prisma.chatMessage.create({
      data: {
        threadUserId: input.threadUserId,
        senderId: input.senderId,
        senderRole: input.senderRole,
        content: input.content,
      },
    });
  }
}