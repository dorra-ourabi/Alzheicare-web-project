import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import { MlClassifierController } from './ml-classifier.controller.js';
import { MlClassifierService } from './ml-classifier.service.js';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [MlClassifierController],
  providers: [MlClassifierService],
  exports: [MlClassifierService],
})
export class MlClassifierModule {}
