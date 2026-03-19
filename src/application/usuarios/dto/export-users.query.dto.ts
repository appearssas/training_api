import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserSortField, SortOrder } from './list-users.dto';

export enum ExportScope {
  ALL = 'all',
  PAGE = 'page',
}

export enum ExportFormat {
  XLSX = 'xlsx',
  CSV = 'csv',
}

/** Máximo de filas por archivo en modo `page` (evita respuestas enormes). */
export const EXPORT_PAGE_MAX_LIMIT = 2000;

/** Tamaño de lote interno al recorrer todos los usuarios (memoria y presión en BD). */
export const EXPORT_BATCH_SIZE = 500;

export class ExportUsersQueryDto {
  @ApiProperty({
    enum: ExportScope,
    description:
      '`all` descarga todos los usuarios que cumplan los filtros (en lotes internos). `page` descarga solo una página (page/limit).',
    example: ExportScope.ALL,
  })
  @IsEnum(ExportScope)
  scope!: ExportScope;

  @ApiProperty({
    enum: ExportFormat,
    default: ExportFormat.XLSX,
    required: false,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.XLSX;

  @ApiProperty({
    description: 'Requerido si scope=page (validado en el caso de uso).',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: `Requerido si scope=page. Máximo ${EXPORT_PAGE_MAX_LIMIT}.`,
    example: 500,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(EXPORT_PAGE_MAX_LIMIT)
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  habilitado?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activo?: boolean;

  @ApiProperty({ required: false, enum: UserSortField })
  @IsOptional()
  @IsEnum(UserSortField)
  sortBy?: UserSortField = UserSortField.FECHA_CREACION;

  @ApiProperty({ required: false, enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
