import {
  IsOptional,
  IsDateString,
  IsBoolean,
  IsString,
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar un certificado
 * Principalmente usado para certificados retroactivos (RF-25 a RF-31)
 * y para edición de fechas de expedición y caducidad
 */
export class UpdateCertificadoDto {
  @ApiPropertyOptional({
    description: 'Fecha de expedición del certificado (editable)',
    example: '2024-12-01',
  })
  @IsOptional()
  @IsDateString()
  fechaEmision?: string;

  @ApiPropertyOptional({
    description: 'Fecha de caducidad del certificado',
    example: '2025-12-01',
  })
  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @ApiPropertyOptional({
    description: 'Fecha retroactiva de emisión (RF-26, RF-27)',
    example: '2024-12-01',
  })
  @IsOptional()
  @IsDateString()
  fechaRetroactiva?: string;

  @ApiPropertyOptional({
    description: 'Indica si el certificado es retroactivo (RF-25)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  esRetroactivo?: boolean;

  @ApiPropertyOptional({
    description: 'Justificación para certificado retroactivo (RF-27)',
    example: 'Reposición por error administrativo',
    minLength: 10,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, {
    message: 'La justificación debe tener al menos 10 caracteres',
  })
  @MaxLength(500, {
    message: 'La justificación no puede exceder 500 caracteres',
  })
  justificacionRetroactiva?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario administrador que modifica el certificado',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  emitidoPor?: number;

  @ApiPropertyOptional({
    description: 'URL del certificado PDF generado',
    example: 'https://storage.example.com/certificates/cert-123.pdf',
  })
  @IsOptional()
  @IsString()
  urlCertificado?: string;
}
