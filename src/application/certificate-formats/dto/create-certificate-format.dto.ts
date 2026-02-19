import {
  IsOptional,
  IsObject,
  ValidateNested,
  IsString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificateFormatDto {
  @ApiPropertyOptional({
    description: 'Configuración PDF única del formato (posiciones, fuentes, etc.)',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  config?: any;

  @ApiPropertyOptional({
    description:
      'Ruta o URL del PNG de fondo (se asigna al subir por POST /certificate-formats/:id/upload-background; storage/certificates o S3)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fondoPath?: string | null;

  @ApiPropertyOptional({
    description: 'Si el formato está activo (solo uno activo a la vez)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
