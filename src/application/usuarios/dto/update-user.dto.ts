import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, MinLength, MaxLength } from 'class-validator';

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
}

