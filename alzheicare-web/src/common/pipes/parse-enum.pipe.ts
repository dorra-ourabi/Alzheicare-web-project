import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseEnumPipe<T = any> implements PipeTransform<string, T> {
  constructor(
    private readonly enumType: Record<string, any>,
    private readonly fieldName = 'value',
  ) {}

  transform(value: string): T {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${this.fieldName} is required`);
    }

    const enumValues = Object.values(this.enumType) as string[];
    if (!enumValues.includes(value)) {
      throw new BadRequestException(`Invalid ${this.fieldName}: ${value}`);
    }

    return value as unknown as T;
  }
}
