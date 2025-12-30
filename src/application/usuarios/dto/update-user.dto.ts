import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
  IsEmail,
  IsIn,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'juan.perez',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username?: string;

  @ApiProperty({
    description: 'ID del rol principal',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  rolPrincipalId?: number;

  @ApiProperty({
    description: 'Estado de habilitación del usuario',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;

  @ApiProperty({
    description: 'Estado activo del usuario',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiProperty({
    description: 'Indica si el usuario debe cambiar su contraseña',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  debeCambiarPassword?: boolean;

  // Campos de persona
  @ApiProperty({
    description: 'Nombres de la persona',
    example: 'Juan',
    required: false,
  })
  @IsOptional()
  @IsString()
  nombres?: string;

  @ApiProperty({
    description: 'Apellidos de la persona',
    example: 'Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  apellidos?: string;

  @ApiProperty({
    description: 'Email de la persona',
    example: 'juan.perez@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Teléfono de la persona',
    example: '+57 322 416 5638',
    required: false,
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({
    description: 'Fecha de nacimiento de la persona',
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  fechaNacimiento?: string;

  @ApiProperty({
    description: 'Género de la persona',
    example: 'M',
    enum: ['M', 'F', 'O'],
    required: false,
  })
  @IsOptional()
  @IsIn(['M', 'F', 'O'])
  genero?: string;

  @ApiProperty({
    description: 'Dirección de la persona',
    example: 'CALLE 16 BIS #5-03 BARRIO DANUBIO',
    required: false,
  })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({
    description: 'ID de la empresa a la que pertenece el usuario',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  empresaId?: number;
}
