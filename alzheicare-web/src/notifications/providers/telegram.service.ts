import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot?: Telegraf;

  constructor(private readonly prisma: PrismaService) {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN is missing. Telegram alerts are disabled.',
      );
      return;
    }

    this.bot = new Telegraf(token);
  }

  async onModuleInit() {
    if (!this.bot) return;

    // Listen for users clicking the "Connect Telegram" button on the frontend
    this.bot.start(async (ctx) => {
      const payload = ctx.payload;
      const telegramChatId = ctx.chat.id.toString();

      if (!payload || !payload.startsWith('user_')) {
        return ctx.reply(
          'Welcome! Please link your account through the AlzheiCare website.',
        );
      }

      const userId = parseInt(payload.replace('user_', ''), 10);

      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { telegramChatId },
        });

        this.logger.log(
          `Linked User #${userId} to Telegram Chat ID ${telegramChatId}`,
        );
        await ctx.reply('✅ Success! Your AlzheiCare account is now linked.');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to link Telegram for User #${userId}: ${errorMessage}`,
        );
        await ctx.reply(
          '❌ Sorry, we could not link your account. Please try again.',
        );
      }
    });

    //SAFE LAUNCH: Prevent NestJS crash if Telegram servers are temporarily unreachable
    this.bot.launch().catch((err) => {
      this.logger.error(`Failed to launch Telegram bot: ${err.message}`);
    });

    this.logger.log('Telegram bot listener is running...');
  }

  //GRACEFUL SHUTDOWN: Stop the bot when the NestJS app closes
  onModuleDestroy() {
    if (this.bot) {
      this.logger.log('Stopping Telegram bot...');
      this.bot.stop('SIGINT');
    }
  }

  async sendMessage(chatId: string, message: string): Promise<boolean> {
    try {
      if (!this.bot) return false;
      await this.bot.telegram.sendMessage(chatId, message);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send message: ${errorMessage}`);
      return false;
    }
  }
}
