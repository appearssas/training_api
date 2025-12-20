import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Genero } from '@/entities/persona/types';

export enum TipoRegistro {
  ALUMNO = 'ALUMNO',
  INSTRUCTOR = 'INSTRUCTOR',
  OPERADOR = 'OPERADOR',
}

export class RegisterDto {
  @ApiProperty({
    description: 'Número de documento de identidad',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  numeroDocumento: string;

  @ApiPropertyOptional({
    description: 'Tipo de documento',
    example: 'CC',
    default: 'CC',
  })
  @IsString()
  @IsOptional()
  tipoDocumento?: string;

  @ApiProperty({
    description: 'Nombres de la persona',
    example: 'Juan',
  })
  @IsString()
  @IsNotEmpty()
  nombres: string;

  @ApiPropertyOptional({
    description: 'Apellidos de la persona',
    example: 'Pérez',
  })
  @IsString()
  @IsOptional()
  apellidos?: string;

  @ApiPropertyOptional({
    description: 'Razón Social (solo jurídicas)',
    example: 'Empresa SAS',
  })
  @IsString()
  @IsOptional()
  razonSocial?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+573001234567',
  })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento (formato ISO)',
    example: '1990-01-15',
  })
  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;

  @ApiPropertyOptional({
    description: 'Género',
    enum: Genero,
    example: Genero.MASCULINO,
  })
  @IsEnum(Genero)
  @IsOptional()
  genero?: Genero;

  @ApiPropertyOptional({
    description: 'Dirección de residencia',
    example: 'Calle 123 #45-67',
  })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto de perfil',
    example: 'https://example.com/foto.jpg',
  })
  @IsString()
  @IsOptional()
  fotoUrl?: string;

  @ApiProperty({
    description: 'Nombre de usuario para el sistema',
    example: 'juan.perez',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Tipo de registro',
    enum: TipoRegistro,
    example: TipoRegistro.OPERADOR,
  })
  @IsEnum(TipoRegistro)
  @IsNotEmpty()
  tipoRegistro: TipoRegistro;

  // Campos específicos para ALUMNO
  @ApiPropertyOptional({
    description: 'Código de estudiante (solo para ALUMNO)',
    example: 'EST001',
  })
  @IsString()
  @IsOptional()
  codigoEstudiante?: string;

  // Campos específicos para INSTRUCTOR
  @ApiPropertyOptional({
    description: 'Especialidad del instructor (solo para INSTRUCTOR)',
    example: 'Desarrollo de Software',
  })
  @IsString()
  @IsOptional()
  especialidad?: string;

  @ApiPropertyOptional({
    description: 'Biografía del instructor (solo para INSTRUCTOR)',
    example: 'Instructor con más de 10 años de experiencia...',
  })
  @IsString()
  @IsOptional()
  biografia?: string;
}
