import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChatService } from './chat.service.js';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    server.use(async (client: Socket, next) => {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string) ||
        this.extractBearerToken(client.handshake.headers?.authorization);

      if (!token) {
        return next(new Error('Unauthorized — no token'));
      }

      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
        });

        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
        });

        if (!user) {
          return next(new Error('Unauthorized — user not found'));
        }

        client.data.user = {
          userId: user.id,
          username: user.username,
          role: user.role,
        };

        next(); 
      } catch (e) {
        return next(new Error('Unauthorized — invalid token'));
      }
    });
  }

  handleConnection(client: Socket) {
    console.log('connected:', client.data.user?.username);

    if (client.data.user) {
      this.server.emit('userStatus', {
        username: client.data.user.username,
        role: client.data.user.role,
        isOnline: true,
      });
    }
  }

  handleDisconnect(client: Socket) {
    console.log('disconnected:', client.id);

    if (client.data.user) {
      this.server.emit('userStatus', {
        username: client.data.user.username,
        role: client.data.user.role,
        isOnline: false,
      });
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() payload: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const authUser = client.data.user;

    if (!authUser) throw new WsException('Unauthorized');

    if (authUser.role !== 'Admin' && payload.userId !== authUser.userId) {
      throw new WsException('Forbidden');
    }

    const room = this.getRoom(payload.userId);
    client.join(room);
    client.emit('joined', { room });

    console.log(`${authUser.username} joined room ${room}`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() payload: { userId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const authUser = client.data.user;

    if (!authUser) throw new WsException('Unauthorized');

    const content = payload.content?.trim();
    if (!content) throw new WsException('Message content is required');

    if (authUser.role !== 'Admin' && payload.userId !== authUser.userId) {
      throw new WsException('Forbidden');
    }

    if (authUser.role === 'Admin') {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!targetUser) throw new WsException('User not found');
    }

    const threadUserId =
      authUser.role === 'Admin' ? payload.userId : authUser.userId;

    const room = this.getRoom(threadUserId);

    const message = await this.chatService.createMessage({
      threadUserId,
      senderId: authUser.userId,
      senderRole: authUser.role,
      content,
    });

    console.log(`message in room ${room} from ${authUser.username}: ${content}`);

    this.server.to(room).emit('message', {
      id: message.id,
      userId: threadUserId,
      fromRole: message.senderRole,
      content: message.content,
      at: message.createdAt.toISOString(),
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() payload: { userId: number; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const authUser = client.data.user;
    if (!authUser) throw new WsException('Unauthorized');

    const room = this.getRoom(payload.userId);

    client.to(room).emit('typing', {
      username: authUser.username,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @MessageBody() payload: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const authUser = client.data.user;
    if (!authUser) throw new WsException('Unauthorized');

    const room = this.getRoom(payload.userId);

    client.to(room).emit('messagesRead', {
      byUser: authUser.username,
      byRole: authUser.role,
      at: new Date().toISOString(),
    });
  }

  @SubscribeMessage('react')
  async handleReact(
    @MessageBody() payload: { userId: number; messageId: number; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    const authUser = client.data.user;
    if (!authUser) throw new WsException('Unauthorized');

    const room = this.getRoom(payload.userId);

    this.server.to(room).emit('reaction', {
      messageId: payload.messageId,
      emoji: payload.emoji,
      fromUser: authUser.username,
    });
  }

  private getRoom(userId: number) {
    return `chat:user:${userId}`;
  }

  private extractBearerToken(authorization?: string | string[]) {
    if (!authorization) return undefined;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice('Bearer '.length).trim();
  }
}