import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoDocumento, Genero } from '@/entities/persona/types';
import { IsStrictEnum } from '@/infrastructure/shared/decorators/strict-enum.decorator';

export class CreateConductorExternoDto {
  @ApiProperty({
    description: 'Número de documento de identidad (obligatorio)',
    example: '1234567890',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  numeroDocumento: string;

  @ApiProperty({
    description: 'Tipo de documento de identidad (obligatorio)',
    enum: TipoDocumento,
    enumName: 'TipoDocumento',
    example: TipoDocumento.CC,
    examples: {
      CC: { value: 'CC', description: 'Cédula de Ciudadanía' },
      TI: { value: 'TI', description: 'Tarjeta de Identidad' },
      CE: { value: 'CE', description: 'Cédula de Extranjería' },
      PA: { value: 'PA', description: 'Pasaporte' },
      RC: { value: 'RC', description: 'Registro Civil' },
      NIT: { value: 'NIT', description: 'Número de Identificación Tributaria' },
    },
  })
  @IsStrictEnum(TipoDocumento, {
    message: 'tipoDocumento debe ser uno de los valores permitidos: CC, TI, CE, PA, RC, NIT',
  })
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  tipoDocumento: TipoDocumento;

  @ApiProperty({
    description: 'Nombres de la persona (obligatorio)',
    example: 'Juan',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  nombres: string;

  @ApiProperty({
    description: 'Apellidos de la persona (obligatorio)',
    example: 'Pérez',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  apellidos: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico de contacto',
    example: 'juan.perez@example.com',
    format: 'email',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono de contacto',
    example: '+573001234567',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento en formato ISO 8601 (YYYY-MM-DD)',
    example: '1990-01-15',
    format: 'date',
    type: String,
  })
  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;

  @ApiPropertyOptional({
    description: 'Género de la persona',
    enum: Genero,
    enumName: 'Genero',
    example: Genero.MASCULINO,
    examples: {
      MASCULINO: { value: 'M', description: 'Masculino' },
      FEMENINO: { value: 'F', description: 'Femenino' },
      OTRO: { value: 'O', description: 'Otro' },
    },
  })
  @IsStrictEnum(Genero, {
    message: 'genero debe ser uno de los valores permitidos: M (MASCULINO), F (FEMENINO), O (OTRO)',
  })
  @IsOptional()
  genero?: Genero;

  @ApiPropertyOptional({
    description: 'Dirección de residencia completa',
    example: 'Calle 123 #45-67, Bogotá, Colombia',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  direccion?: string;
}

