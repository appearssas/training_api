import {
  IsString,
  IsInt,
  IsOptional,
  IsUrl,
  Length,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'ID de la capacitación a la que pertenece el material',
    example: 1,
  })
  @IsInt()
  capacitacionId: number;

  @ApiProperty({
    description: 'ID del tipo de material (PDF, IMAGEN, VIDEO, etc.)',
    example: 1,
  })
  @IsInt()
  tipoMaterialId: number;

  @ApiProperty({
    description: 'Nombre del material',
    example: 'Guía de Manejo Defensivo',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @Length(1, 200)
  nombre: string;

  @ApiProperty({
    description: 'URL del material (archivo o enlace externo)',
    example: 'https://example.com/material.pdf',
    maxLength: 1000,
  })
  @IsString()
  @IsUrl({}, { message: 'La URL debe ser válida' })
  @Length(1, 1000)
  url: string;

  @ApiPropertyOptional({
    description: 'Descripción del material',
    example: 'Material de apoyo sobre técnicas de manejo defensivo',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Orden de visualización del material',
    example: 1,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}

