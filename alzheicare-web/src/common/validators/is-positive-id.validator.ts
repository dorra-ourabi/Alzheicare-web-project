import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsPositiveId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPositiveId',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'number' && Number.isInteger(value) && value > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a positive integer`; 
        },
      },
    });
  };
}
