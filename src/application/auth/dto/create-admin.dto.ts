import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Genero, TipoDocumento } from '@/entities/persona/types';
import { IsStrictEnum } from '@/infrastructure/shared/decorators/strict-enum.decorator';

export class CreateAdminDto {
  @ApiProperty({
    description: 'Número de documento de identidad',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
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
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  nombres: string;

  @ApiProperty({
    description: 'Apellidos de la persona',
    example: 'Pérez',
  })
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  apellidos: string;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'admin@example.com',
  })
  @IsEmail()
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

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

  @ApiProperty({
    description: 'Nombre de usuario para el sistema',
    example: 'admin.juan',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty({ message: 'El username es obligatorio' })
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
  username: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'SecurePassword123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}

