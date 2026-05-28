import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsEnumString(
  entity: object,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEnumString',
      target: object.constructor,
      propertyName,
      constraints: [entity],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [enumType] = args.constraints as [object];
          if (typeof value !== 'string') {
            return false;
          }
          const values = Object.values(enumType) as string[];
          return values.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          const [enumType] = args.constraints as [object];
          const values = Object.values(enumType).join(', ');
          return `${args.property} must be one of the following values: ${values}`;
        },
      },
    });
  };
}
