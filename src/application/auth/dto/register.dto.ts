import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Genero, TipoDocumento } from '@/entities/persona/types';
import { IsStrictEnum } from '@/infrastructure/shared/decorators/strict-enum.decorator';

export enum TipoRegistro {
  ALUMNO = 'ALUMNO',
  INSTRUCTOR = 'INSTRUCTOR',
  OPERADOR = 'OPERADOR',
  CLIENTE = 'CLIENTE',
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
    enum: TipoDocumento,
    example: TipoDocumento.CC,
    default: TipoDocumento.CC,
  })
  @IsStrictEnum(TipoDocumento, {
    message: 'tipoDocumento debe ser uno de los valores permitidos: CC, TI, CE, PA, RC, NIT',
  })
  @IsOptional()
  tipoDocumento?: TipoDocumento;

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

  @ApiProperty({
    description: 'Tipo de persona: NATURAL o JURIDICA. Si no se especifica, se determina automáticamente: JURIDICA si tiene razón social, NATURAL en caso contrario.',
    enum: ['NATURAL', 'JURIDICA'],
    example: 'NATURAL',
    default: 'NATURAL',
    required: false,
  })
  @IsStrictEnum(['NATURAL', 'JURIDICA'], {
    message: 'tipoPersona debe ser NATURAL o JURIDICA',
  })
  @IsOptional()
  tipoPersona?: 'NATURAL' | 'JURIDICA';

  @ApiPropertyOptional({
    description: 'Razón Social (obligatorio para personas jurídicas). Si se proporciona razón social, el tipoPersona se establecerá automáticamente como JURIDICA.',
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
  @IsStrictEnum(Genero, {
    message: 'genero debe ser uno de los valores permitidos: M (MASCULINO), F (FEMENINO), O (OTRO)',
  })
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
  @IsStrictEnum(TipoRegistro, {
    message: 'tipoRegistro debe ser ALUMNO, INSTRUCTOR, OPERADOR o CLIENTE',
  })
  @IsNotEmpty()
  tipoRegistro: TipoRegistro;

  // Campos específicos para ALUMNO
  // NOTA: El código de estudiante se genera automáticamente en formato EST{YYYY}{NNNNN}
  // Ejemplo: EST20250001, EST20250002, etc.

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

  @ApiPropertyOptional({
    description: 'Indica si el usuario debe ser habilitado inmediatamente. Por defecto es false.',
    example: false,
    default: false,
  })
  @IsOptional()
  habilitado?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si el usuario acepta los términos y condiciones. Si es true, se aceptarán automáticamente todos los documentos legales activos después del registro.',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  aceptaTerminos?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si el usuario acepta la política de tratamiento de datos personales. Si es true junto con aceptaTerminos, se aceptarán automáticamente todos los documentos legales activos después del registro.',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  aceptaPoliticaDatos?: boolean;
}
