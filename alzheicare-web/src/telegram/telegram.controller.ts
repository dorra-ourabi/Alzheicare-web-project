import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly configService: ConfigService) {}

  @UseGuards(JwtAuthGuard)
  @Get('link')
  getLink(@Req() req: Request & { user?: { id?: number; sub?: number } }) {
    const userId = Number(req.user?.id ?? req.user?.sub);
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const botName = this.configService.get<string>('TELEGRAM_BOT_USERNAME');
    return { url: `https://t.me/${botName}?start=user_${userId}` };
  }
}
