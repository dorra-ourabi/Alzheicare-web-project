import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface CreateMessageInput {
  conversationId: number;
  senderId: number;
  content: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(input: CreateMessageInput) {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: input.senderId,
          content: input.content,
        },
      });

      await tx.conversation.update({
        where: { id: input.conversationId },
        data: { lastMessageAt: new Date() },
      });

      return message;
    });
  }
}
