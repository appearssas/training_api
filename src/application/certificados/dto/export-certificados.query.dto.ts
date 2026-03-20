import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from '@/application/shared/dto/pagination.dto';

export enum ExportCertificatesScope {
  ALL = 'all',
  PAGE = 'page',
}

export enum ExportCertificatesFormat {
  XLSX = 'xlsx',
  CSV = 'csv',
}

export const EXPORT_CERTIFICATES_PAGE_MAX_LIMIT = 2000;
export const EXPORT_CERTIFICATES_BATCH_SIZE = 500;

export class ExportCertificadosQueryDto {
  @ApiProperty({
    enum: ExportCertificatesScope,
    description:
      '`all` descarga todos los certificados filtrados. `page` descarga solo una página.',
    example: ExportCertificatesScope.ALL,
  })
  @IsEnum(ExportCertificatesScope)
  scope!: ExportCertificatesScope;

  @ApiProperty({
    enum: ExportCertificatesFormat,
    default: ExportCertificatesFormat.XLSX,
    required: false,
  })
  @IsOptional()
  @IsEnum(ExportCertificatesFormat)
  format?: ExportCertificatesFormat = ExportCertificatesFormat.XLSX;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    required: false,
    example: 500,
    description: `Solo para scope=page. Máximo ${EXPORT_CERTIFICATES_PAGE_MAX_LIMIT}.`,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(EXPORT_CERTIFICATES_PAGE_MAX_LIMIT)
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'ID de curso (capacitacion).' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  courseId?: number;

  @ApiProperty({
    required: false,
    description: 'Estado (valid|expired|revoked).',
    example: 'valid',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: 'Campo de orden.' })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiProperty({ required: false, enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
