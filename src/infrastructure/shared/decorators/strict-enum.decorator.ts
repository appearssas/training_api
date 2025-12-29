import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Decorador personalizado para validar enums estrictamente
 * Rechaza valores que no coincidan exactamente con los valores del enum
 */
export function IsStrictEnum(
  enumObject: object,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrictEnum',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [enumObject],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [enumObject] = args.constraints;
          const enumValues = Object.values(enumObject);

          // Si el valor es undefined o null y el campo es opcional, permitirlo
          if (value === undefined || value === null) {
            return true; // La validación de @IsOptional se encargará de esto
          }

          // Validar que el valor coincida exactamente con uno de los valores del enum
          return enumValues.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          const [enumObject] = args.constraints;
          const enumValues = Object.values(enumObject);
          const enumKeys = Object.keys(enumObject).filter(
            (key) => isNaN(Number(key)), // Filtrar índices numéricos
          );

          return `$property debe ser uno de los siguientes valores: ${enumValues.join(', ')}. Valores permitidos: ${enumKeys.join(', ')}`;
        },
      },
    });
  };
}
