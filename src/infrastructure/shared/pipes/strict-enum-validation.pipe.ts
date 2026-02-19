import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

/**
 * ValidationPipe personalizado que valida enums estrictamente
 * sin transformación automática, rechazando valores que no coincidan exactamente
 */
@Injectable()
export class StrictEnumValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value as unknown;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: false, // No transformar para validación estricta de enums
      transformOptions: {
        enableImplicitConversion: false, // Deshabilitar conversión implícita
      },
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const errorMessages = this.formatValidationErrors(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    // Después de validar, aplicar transformación solo para tipos no-enum
    const plain: object | object[] = Array.isArray(value)
      ? (value as object[])
      : (value as object);
    return plainToInstance(metatype, plain, {
      enableImplicitConversion: true,
      excludeExtraneousValues: true,
    }) as unknown;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatValidationErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    errors.forEach(error => {
      if (error.constraints) {
        Object.values(error.constraints).forEach(message => {
          messages.push(message);
        });
      }

      // Validar propiedades anidadas
      if (error.children && error.children.length > 0) {
        const nestedMessages = this.formatValidationErrors(error.children);
        nestedMessages.forEach(message => {
          messages.push(`${error.property}.${message}`);
        });
      }
    });

    return messages;
  }
}
