import { IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificateFormatType } from '@/entities/certificate-formats/certificate-format.entity';
import { PdfConfig } from '@/infrastructure/shared/types/pdf-config.interface';

export class CreateCertificateFormatDto {
  @ApiProperty({
    enum: CertificateFormatType,
    description: 'Tipo de formato de certificado',
    example: CertificateFormatType.OTROS,
  })
  @IsEnum(CertificateFormatType)
  tipo: CertificateFormatType;

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
}
