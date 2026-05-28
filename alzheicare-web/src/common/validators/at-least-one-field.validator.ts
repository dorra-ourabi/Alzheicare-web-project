import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function AtLeastOneField(
  properties: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOneField',
      target: object.constructor,
      propertyName,
      constraints: [properties],
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const object = args.object as Record<string, unknown>;
          const propertiesToCheck = args.constraints[0] as string[];
          return propertiesToCheck.some((property) => {
            const value = object[property];
            return value !== undefined && value !== null && value !== '';
          });
        },
        defaultMessage(args: ValidationArguments) {
          const propertiesToCheck = args.constraints[0] as string[];
          return `At least one of ${propertiesToCheck.join(', ')} must be provided.`;
        },
      },
    });
  };
}
