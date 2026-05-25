import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service.js';
import { StripeController } from './stripe.controller.js';

@Module({
  providers: [StripeService],
  controllers: [StripeController],
})
export class StripeModule {}
