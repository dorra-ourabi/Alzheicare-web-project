import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StripeService } from './stripe.service.js';
import { StripeController } from './stripe.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [StripeService],
  controllers: [StripeController],
})
export class StripeModule {}
