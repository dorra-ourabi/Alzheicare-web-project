import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsDateString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateString',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return false;
          }
          const parsed = new Date(value);
          return !Number.isNaN(parsed.getTime());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid ISO date string`; 
        },
      },
    });
  };
}
