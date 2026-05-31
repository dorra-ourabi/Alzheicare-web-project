import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { CurrentUser } from '../Decorators/currentUser.decorator.js';
import { UserRole } from '../../generated/prisma/client.js';
import { AiAssistantService } from './ai-assistant.service.js';
import {
  ChatDto,
  PatientIdQueryDto,
  RagDebugDto,
  SpeakDto,
} from './dto/chat.dto.js';

interface AuthUser {
  sub: number;
  role?: UserRole;
}

@Controller('ai-assistant')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @UseGuards(JwtAuthGuard)
  @Get('health')
  getHealth() {
    return this.aiAssistantService.getHealth();
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  chat(@CurrentUser() user: AuthUser, @Body() dto: ChatDto) {
    return this.aiAssistantService.chat(
      user.sub,
      user.role,
      dto.message,
      dto.language,
      dto.patientId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat/stream')
  async chatStream(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChatDto,
    @Res() res: Response,
  ) {
    const upstream = await this.aiAssistantService.chatStream(
      user.sub,
      user.role,
      dto.message,
      dto.language,
      dto.patientId,
    );

    if (!upstream.ok || !upstream.body) {
      res.status(upstream.status).json({
        message: 'AI assistant stream failed',
        status: upstream.status,
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.status(upstream.status);

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        res.write(decoder.decode(value, { stream: true }));
      }
    } finally {
      res.end();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('chat/history')
  clearHistory(
    @CurrentUser() user: AuthUser,
    @Query() query: PatientIdQueryDto,
  ) {
    return this.aiAssistantService.clearHistory(
      user.sub,
      user.role,
      query.patientId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  transcribe(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string },
    @Body('language') language: string | undefined,
    @Body('patientId') patientId: string | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    return this.aiAssistantService.transcribe(
      user.sub,
      user.role,
      file,
      language,
      patientId ? Number(patientId) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('speak')
  async speak(
    @CurrentUser() user: AuthUser,
    @Body() dto: SpeakDto,
    @Res() res: Response,
  ) {
    const audio = await this.aiAssistantService.speak(
      user.sub,
      user.role,
      dto.text,
      dto.patientId,
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename=response.mp3');
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(audio));
  }

  @UseGuards(JwtAuthGuard)
  @Get('rag/status')
  ragStatus(
    @CurrentUser() user: AuthUser,
    @Query() query: PatientIdQueryDto,
  ) {
    return this.aiAssistantService.ragStatus(
      user.sub,
      user.role,
      query.patientId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('rag/debug-retrieve')
  ragDebugRetrieve(@CurrentUser() user: AuthUser, @Body() dto: RagDebugDto) {
    return this.aiAssistantService.ragDebugRetrieve(
      user.sub,
      user.role,
      dto.query,
      dto.topK,
      dto.patientId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('rag/reload')
  ragReload(
    @CurrentUser() user: AuthUser,
    @Query() query: PatientIdQueryDto,
  ) {
    return this.aiAssistantService.ragReload(
      user.sub,
      user.role,
      query.patientId,
    );
  }
}
