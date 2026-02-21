import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnteCertificadorDto {
  @ApiProperty({
    description: 'Nombre del ente certificador',
    example: 'Ministerio de Transporte',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({
    description: 'Código único',
    example: 'MINTRA',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo: string;

  @ApiPropertyOptional({ description: 'Descripción', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Información de contacto',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  informacionContacto?: string;

  @ApiPropertyOptional({ description: 'Activo', default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'ID del formato de certificado asignado a este ente',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  certificateFormatId?: number | null;
}
