import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service.js';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller()
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('webhooks/stripe')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>, 
  ) {
    // 1. Grab the signature from the headers.
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // 2. Grab the raw bytes.
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    // 3. Hand the raw data and the signature over to the Service to do the math.
    return this.stripeService.processWebhook(signature, rawBody);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stripe/create-checkout-session')
  async createSession(@Req() req: Request & { user?: { sub?: number; id?: number; email?: string } }) {
    const userId = req.user?.id ?? req.user?.sub;
    if (!userId) {
      throw new BadRequestException('Authenticated user id is missing');
    }

    let userEmail = req.user?.email;
    if (!userEmail) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user?.email) {
        throw new BadRequestException('User email not found');
      }

      userEmail = user.email;
    }

    return this.stripeService.createCheckoutSession(userId, userEmail);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stripe/portal')
  async createPortal(@Req() req: Request & { user?: { sub?: number; id?: number } }) {
    const userId = req.user?.id ?? req.user?.sub;
    if (!userId) {
      throw new BadRequestException('Authenticated user id is missing');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer found for this user');
    }

    return this.stripeService.createPortalSession(user.stripeCustomerId);
  }
}
