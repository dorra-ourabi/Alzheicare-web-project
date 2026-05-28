import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import type { Request, Response } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get('stream')
  async stream(@Req() req: Request, @Res() res: Response) {
    const token =
      (req.query.token as string) ||
      (req.headers.authorization as string)?.split(' ')[1];

    if (!token) {
      res.status(401).end();
      return;
    }

    let userId: number;
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      userId = payload.sub;
    } catch {
      res.status(401).end();
      return;
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const listener = (payload: any) => {
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch {}
    };

    this.eventEmitter.on(`notification.push:${userId}`, listener);

    req.on('close', () => {
      this.eventEmitter.removeListener(`notification.push:${userId}`, listener);
      try {
        res.end();
      } catch {}
    });
  }
}
