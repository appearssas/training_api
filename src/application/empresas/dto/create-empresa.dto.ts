import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty({
    description: 'Número de documento de la empresa (NIT)',
    example: '900123456-1',
    maxLength: 50,
  })
  @IsString({ message: 'El número de documento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El número de documento es requerido' })
  @MaxLength(50, {
    message: 'El número de documento no puede exceder 50 caracteres',
  })
  @Matches(/^[0-9-]+$/, {
    message: 'El número de documento solo puede contener números y guiones',
  })
  numeroDocumento: string;

  @ApiPropertyOptional({
    description: 'Tipo de documento (por defecto NIT)',
    example: 'NIT',
    default: 'NIT',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser una cadena de texto' })
  @MaxLength(20, {
    message: 'El tipo de documento no puede exceder 20 caracteres',
  })
  tipoDocumento?: string;

  @ApiProperty({
    description: 'Razón social de la empresa',
    example: 'Empresa SAS',
    maxLength: 500,
  })
  @IsString({ message: 'La razón social debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La razón social es requerida' })
  @MaxLength(500, {
    message: 'La razón social no puede exceder 500 caracteres',
  })
  razonSocial: string;

  @ApiPropertyOptional({
    description: 'Email de contacto de la empresa',
    example: 'contacto@empresa.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto de la empresa',
    example: '+573001234567',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El teléfono no puede exceder 50 caracteres' })
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Dirección de la empresa',
    example: 'Calle 123 #45-67, Bogotá',
  })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  direccion?: string;
}
