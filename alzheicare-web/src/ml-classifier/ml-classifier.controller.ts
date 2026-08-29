import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { MlClassifierService } from './ml-classifier.service.js';

@Controller('ml-classifier')
export class MlClassifierController {
  constructor(private readonly mlClassifierService: MlClassifierService) {}

  @Get('health')
  getHealth() {
    return this.mlClassifierService.getHealth();
  }

  @UseGuards(JwtAuthGuard)
  @Post('predict')
  @UseInterceptors(FileInterceptor('file'))
  predict(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('MRI image file is required');
    }
    return this.mlClassifierService.predictMri({
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
    });
  }
}
