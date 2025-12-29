import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nombres?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  apellidos?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => value || undefined)
  fechaNacimiento?: string;

  @ApiPropertyOptional({ enum: ['M', 'F', 'O'] })
  @IsEnum(['M', 'F', 'O'])
  @IsOptional()
  @Transform(({ value }) => value || undefined)
  genero?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  razonSocial?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fotoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  especialidad?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  biografia?: string;

  @ApiPropertyOptional({
    description: 'Contraseña actual (requerida si se cambia la contraseña)',
  })
  @IsString()
  @ValidateIf((o) => o.newPassword)
  currentPassword?: string;

  @ApiPropertyOptional({
    description: 'Nueva contraseña (mínimo 8 caracteres)',
  })
  @IsString()
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  @IsOptional()
  newPassword?: string;
}
