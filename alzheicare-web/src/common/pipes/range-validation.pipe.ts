import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class RangeValidationPipe implements PipeTransform<number, number> {
  constructor(private readonly min: number, private readonly max: number) {}

  transform(value: number): number {
    if (value === undefined || value === null) {
      throw new BadRequestException('Numeric value is required');
    }

    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new BadRequestException('Invalid numeric value');
    }

    if (value < this.min || value > this.max) {
      throw new BadRequestException(`Value must be between ${this.min} and ${this.max}`);
    }

    return value;
  }
}
