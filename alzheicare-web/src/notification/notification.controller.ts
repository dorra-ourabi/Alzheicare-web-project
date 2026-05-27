import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { Response, Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @UseGuards(JwtAuthGuard)
  @Get('stream')
  async stream(@Req() req: Request, @Res() res: Response) {
    const userId = (req as any).user.sub;

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const send = (payload: any) => {
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {
        // ignore
      }
    };

    const listener = (payload: any) => {
      send(payload);
    };

    this.eventEmitter.on(`notification.push:${userId}`, listener);

    req.on('close', () => {
      this.eventEmitter.removeListener(`notification.push:${userId}`, listener);
      try {
        res.end();
      } catch (err) {}
    });
  }
}
