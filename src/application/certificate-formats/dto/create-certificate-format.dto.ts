import { IsOptional, IsObject, ValidateNested, IsString, IsBoolean, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificateFormatDto {
  @ApiPropertyOptional({
    description: 'Configuración para certificados de alimentos',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  configAlimentos?: any;

  @ApiPropertyOptional({
    description: 'Configuración para certificados de sustancias peligrosas',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  configSustancias?: any;

  @ApiPropertyOptional({
    description: 'Configuración para otros tipos de certificados',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  configOtros?: any;

  @ApiPropertyOptional({
    description: 'Ruta relativa del PNG de fondo para certificados de alimentos (ej: assets/fondoAlimentos.png)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fondoAlimentosPath?: string | null;

  @ApiPropertyOptional({
    description: 'Ruta relativa del PNG de fondo para certificados de sustancias',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fondoSustanciasPath?: string | null;

  @ApiPropertyOptional({
    description: 'Ruta relativa del PNG de fondo para certificados generales/otros',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fondoGeneralPath?: string | null;

  @ApiPropertyOptional({
    description: 'Si el formato está activo (solo uno activo a la vez)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
