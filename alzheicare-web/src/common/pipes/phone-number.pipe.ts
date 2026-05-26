import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PhoneNumberPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException('Phone number is required');
    }

    const normalized = value.toString().trim();
    const cleaned = normalized.replace(/[\s.-]/g, '');
    const regex = /^\+?[0-9]{6,15}$/;

    if (!regex.test(cleaned)) {
      throw new BadRequestException('Invalid phone number format');
    }

    return cleaned;
  }
}
