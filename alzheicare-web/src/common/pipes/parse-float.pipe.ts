import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseFloatPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException('Float value is required');
    }

    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
      throw new BadRequestException('Invalid float value');
    }

    return parsed;
  }
}
