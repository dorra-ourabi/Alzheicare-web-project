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
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChatService } from './chat.service.js';
import { AuthService } from '../auth/Services/auth.service.js';
import { RedisService } from '../auth/Services/redis.service.js';
import { MailService } from '../mail/mail.service.js';

// @WebSocketGateway opens a WebSocket server alongside the HTTP server.
// cors: '*' allows any frontend to connect — restrict this in production.
@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  // The socket.io Server instance — used to emit events to rooms/clients
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  // ─── afterInit ────────────────────────────────────────────────────────────
  // Runs ONCE when the WebSocket server starts.
  // We attach a middleware here that acts as a bouncer:
  // every incoming connection must pass token verification before being allowed in.
  // This is the WebSocket equivalent of your HTTP AuthGuard.
  afterInit(server: Server) {
    server.use(async (client: Socket, next) => {
      // Extract the JWT token from one of three possible locations the client might send it:
      // 1. socket.io auth object  → preferred: socket.connect({ auth: { token } })
      // 2. URL query param        → fallback:  ws://server?token=xxx
      // 3. Authorization header   → fallback:  Bearer xxx
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string) ||
        this.extractBearerToken(client.handshake.headers?.authorization);

      // No token at all → reject the connection immediately
      if (!token) {
        return next(new Error('Unauthorized — no token'));
      }

      try {
        // Verify the access token signature and expiry using the same
        // logic as your HTTP auth — returns the decoded payload { sub, role, sessionId... }
        const payload = await this.authService.verifyAccessToken(token);

        // Fetch the full user from DB to get their doctor/patient profile IDs.
        // We need doctorId and patientId to later check conversation ownership.
        const user = await this.prisma.user.findFirst({
          where: { id: payload.sub, deletedAt: null },
          include: { doctor: true, patient: true },
        });

        // User deleted or not found → reject
        if (!user) {
          return next(new Error('Unauthorized — user not found'));
        }

        // Attach the user's identity to the socket object.
        // client.data persists for the entire lifetime of this connection
        // and is accessible in every event handler via client.data.user.
        client.data.user = {
          userId: user.id,
          username: user.username,
          role: user.role,
          doctorId: user.doctor?.id ?? null,
          patientId: user.patient?.id ?? null,
        };

        // Token is valid, user exists → allow the connection
        next();
      } catch (e) {
        // Token verification threw (expired, tampered, etc.) → reject
        return next(new Error('Unauthorized — invalid token'));
      }
    });
  }

  // ─── handleConnection ─────────────────────────────────────────────────────
  // Fires when a client SUCCESSFULLY connects (after passing the middleware above).
  // We broadcast to ALL connected sockets that this user is now online.
  handleConnection(client: Socket) {
    console.log('connected:', client.data.user?.username);

    if (client.data.user) {
      // server.emit (no room) → sends to every connected socket
      this.server.emit('userStatus', {
        username: client.data.user.username,
        role: client.data.user.role,
        isOnline: true,
      });
    }
  }

  // ─── handleDisconnect ─────────────────────────────────────────────────────
  // Fires when a client disconnects (tab closed, network drop, logout).
  // We broadcast to ALL connected sockets that this user is now offline.
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

  // ─── join ─────────────────────────────────────────────────────────────────
  // Client emits 'join' { conversationId } to enter a conversation room.
  // A "room" is an isolated channel — only sockets in the same room
  // receive messages emitted to it.
  // The client MUST join before they can send or receive messages.
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() payload: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const authUser = client.data.user; // set during handshake in afterInit
    if (!authUser) throw new WsException('Unauthorized');

    // Room name is namespaced to avoid collisions with other room types
    const room = this.getRoom(payload.conversationId);

    // Put this socket into the room
    client.join(room);

    // Confirm back to the joining client only (not the whole room)
    client.emit('joined', { room });

    console.log(`${authUser.username} joined room ${room}`);
  }

  // ─── message ──────────────────────────────────────────────────────────────
  // Client emits 'message' { conversationId, content } to send a chat message.
  // Flow:
  //   1. Verify sender belongs to this conversation
  //   2. Save message to DB
  //   3. Broadcast to the entire room (both doctor and patient receive it)
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() payload: { conversationId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const authUser = client.data.user;
    if (!authUser) throw new WsException('Unauthorized');

    // Reject empty messages
    const content = payload.content?.trim();
    if (!content) throw new WsException('Message content is required');

    // Fetch the conversation to verify ownership
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: payload.conversationId },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });
    if (!conversation) throw new WsException('Conversation not found');

    // Check that the sender is either the doctor OR the patient of this conversation.
    // Prevents a user from injecting messages into someone else's conversation.
    const isDoctor =
      authUser.doctorId && conversation.doctorId === authUser.doctorId;
    const isPatient =
      authUser.patientId && conversation.patientId === authUser.patientId;
    if (!isDoctor && !isPatient) throw new WsException('Forbidden');

    const room = this.getRoom(conversation.id);

    // Persist the message to the database
    const message = await this.chatService.createMessage({
      conversationId: conversation.id,
      senderId: authUser.userId,
      content,
    });

    const shouldNotify = await this.redisService.setIfNotExists(
      this.firstMessageNotifyKey(conversation.id),
      '1',
      this.firstMessageNotifyTtlSeconds(),
    );

    if (
      shouldNotify &&
      conversation.doctor?.user &&
      conversation.patient?.user
    ) {
      await this.mailService.sendFirstMessageAfterPeriodEmail(
        conversation.doctor.user,
        conversation.patient.user,
        authUser.username,
        message.content,
      );
    }

    console.log(
      `message in room ${room} from ${authUser.username}: ${content}`,
    );

    // Broadcast to the ENTIRE room including the sender.
    // server.to(room) = everyone in room (including sender)
    // client.to(room) = everyone in room EXCEPT the sender
    // We use server.to() here so the sender also gets confirmation their message was saved.
    this.server.to(room).emit('message', {
      id: message.id,
      conversationId: conversation.id,
      fromRole: authUser.role,
      content: message.content,
      at: message.sentAt.toISOString(),
    });
  }

  // ─── typing ───────────────────────────────────────────────────────────────
  // Client emits 'typing' { conversationId, isTyping } while the user types.
  // We forward it to everyone else in the room — the sender doesn't need
  // to know they're typing themselves.
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() payload: { conversationId: number; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const authUser = client.data.user;
    if (!authUser) throw new WsException('Unauthorized');

    const room = this.getRoom(payload.conversationId);

    // client.to(room) → sends to everyone in room EXCEPT this client
    client.to(room).emit('typing', {
      username: authUser.username,
      isTyping: payload.isTyping,
    });
  }

  // ─── markRead ─────────────────────────────────────────────────────────────
  // Client emits 'markRead' { conversationId } when they open/read the conversation.
  // This sends a real-time read receipt to the other person.
  // Note: this is a real-time signal only — it does not update the DB.
  // If you want persistent read status, call chatService.markMessagesRead() here too.
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @MessageBody() payload: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const authUser = client.data.user;
    if (!authUser) throw new WsException('Unauthorized');

    const room = this.getRoom(payload.conversationId);

    // Notify the other person only (not the reader themselves)
    client.to(room).emit('messagesRead', {
      byUser: authUser.username,
      byRole: authUser.role,
      at: new Date().toISOString(),
    });
  }

  // ─── react ────────────────────────────────────────────────────────────────
  // Client emits 'react' { conversationId, messageId, emoji } to add a reaction.
  // Broadcasts the reaction to everyone in the room including the sender.
  @SubscribeMessage('react')
  async handleReact(
    @MessageBody()
    payload: { conversationId: number; messageId: number; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    const authUser = client.data.user;
    if (!authUser) throw new WsException('Unauthorized');

    const room = this.getRoom(payload.conversationId);

    // server.to() → everyone in room including sender
    this.server.to(room).emit('reaction', {
      messageId: payload.messageId,
      emoji: payload.emoji,
      fromUser: authUser.username,
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  // Builds a namespaced room name from a conversationId.
  // Namespacing ("chat:conversation:X") avoids collisions if you later
  // add other room types (e.g. "notifications:user:X").
  private getRoom(conversationId: number) {
    return `chat:conversation:${conversationId}`;
  }

  private firstMessageNotifyKey(conversationId: number) {
    return `chat:first-message:${conversationId}`;
  }

  private firstMessageNotifyTtlSeconds() {
    return 24 * 60 * 60;
  }

  // Extracts the token from an "Authorization: Bearer <token>" header.
  // Handles the case where the header might be an array (some proxies do this).
  private extractBearerToken(authorization?: string | string[]) {
    if (!authorization) return undefined;
    const header = Array.isArray(authorization)
      ? authorization[0]
      : authorization;
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice('Bearer '.length).trim();
  }
}
