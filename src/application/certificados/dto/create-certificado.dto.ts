import {
  IsInt,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear un certificado
 * RF-22: Generación automática de certificado PDF
 * RF-25 a RF-31: Soporte para certificados retroactivos
 */
export class CreateCertificadoDto {
  @ApiProperty({
    description: 'ID de la inscripción asociada',
    example: 1,
  })
  @IsInt()
  inscripcionId: number;

  @ApiPropertyOptional({
    description: 'Fecha retroactiva de emisión (RF-26, RF-27)',
    example: '2024-12-01',
  })
  @IsOptional()
  @IsDateString()
  fechaRetroactiva?: string;

  @ApiPropertyOptional({
    description: 'Indica si el certificado es retroactivo (RF-25)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esRetroactivo?: boolean;

  @ApiPropertyOptional({
    description: 'Justificación para certificado retroactivo (RF-27)',
    example: 'Capacitación presencial realizada con posterior registro',
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
    description:
      'ID del usuario administrador que emite el certificado (para auditoría)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  emitidoPor?: number;
}
