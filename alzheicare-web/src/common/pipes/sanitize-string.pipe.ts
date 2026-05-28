import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SanitizeStringPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (value === undefined || value === null) {
      return value as unknown as string;
    }

    const sanitized = value
      .toString()
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return sanitized;
  }
}
