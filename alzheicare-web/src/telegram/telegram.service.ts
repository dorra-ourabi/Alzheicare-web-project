import { Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot?: Telegraf;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN is not set. Telegram bot is disabled.');
      return;
    }

    this.bot = new Telegraf(token);

    this.bot.start(async (ctx) => {
      const rawPayload = 'startPayload' in ctx ? (ctx as { startPayload?: string }).startPayload : undefined;
      const payloadFromText = ctx.message?.text?.split(' ')[1];
      const payload = rawPayload ?? payloadFromText;
      const match = payload ? /^user_(\d+)$/i.exec(payload) : null;

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
        await ctx.reply('Your Telegram account has been linked successfully.');
      } catch (error) {
        console.error('Failed to link Telegram chat ID', error);
        await ctx.reply('Failed to link Telegram. Please try again later.');
      }
    });

    await this.bot.launch();
    console.log('Telegram bot started.');
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.bot) {
      console.warn('Telegram bot is not initialized. Message not sent.');
      return;
    }

    await this.bot.telegram.sendMessage(chatId, message);
  }
}
