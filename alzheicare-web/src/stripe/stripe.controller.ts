import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service.js';


@Controller('webhooks/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post()
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
}
