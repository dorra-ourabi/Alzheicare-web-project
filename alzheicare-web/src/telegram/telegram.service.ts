import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TelegramService
  implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy
{
  private bot: Telegraf;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN is not set. Telegram bot is disabled.');
      return;
    }

    this.bot = new Telegraf(token);

    this.bot.start(async (ctx) => {
      const rawPayload =
        'startPayload' in ctx
          ? (ctx as { startPayload?: string }).startPayload
          : undefined;
      const payloadFromText = ctx.message?.text?.split(' ')[1];
      const payload = rawPayload ?? payloadFromText;
      if (!payload) {
        await ctx.reply(
          '👋 Bonjour ! Pour lier votre compte, veuillez cliquer sur le bouton "Connecter Telegram" depuis votre tableau de bord.',
        );
        return;
      }

      const match = /^user_(\d+)$/i.exec(payload);
      if (!match) {
        await ctx.reply('Invalid or missing start payload.');
        return;
      }

      const userId = Number(match[1]);
      const chatId = ctx.chat?.id;

      if (!Number.isInteger(userId) || !chatId) {
        await ctx.reply('Unable to link Telegram to your account.');
        return;
      }

      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { telegramChatId: String(chatId) },
        });
        await ctx.reply(
          '✅ Votre compte a été lié avec succès ! Vous recevrez vos notifications ici.',
        );
      } catch (error) {
        console.error('Failed to link Telegram chat ID', error);
        await ctx.reply('Failed to link Telegram. Please try again later.');
      }
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.bot) {
      return;
    }

    await this.launchPolling();
  }

  onModuleDestroy(): void {
    if (this.bot) {
      this.bot.stop('SIGTERM');
    }
  }

  private launchPolling(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.bot
        .launch({ dropPendingUpdates: true }, () => {
          console.log('Telegram bot en écoute (long polling)');
          resolve();
        })
        .catch((err) => reject(err));
    });
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.bot) {
      console.warn('Telegram bot is not initialized. Message not sent.');
      return;
    }

    await this.bot.telegram.sendMessage(chatId, message);
  }
}
