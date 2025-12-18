import {
  IsInt,
  IsOptional,
  Min,
  Max,
  IsEnum,
  IsString,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationDto {
  @ApiProperty({
    description: 'Número de página',
    example: 1,
    minimum: 1,
    maximum: 1000,
    default: 1,
  })
  @IsInt({ message: 'Page must be a number' })
  @Min(1, { message: 'Page must be greater than 0' })
  @Max(1000, { message: 'Page cannot exceed 1000' })
  page: number = 1;

  @ApiProperty({
    description: 'Cantidad de elementos por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsInt({ message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be greater than 0' })
  @Max(100, { message: 'Limit cannot exceed 100 items per page' })
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Término de búsqueda',
    example: 'react',
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtros adicionales',
    example: { estado: 'publicada', tipo: 1 },
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    example: 'fecha_creacion',
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a valid column name' })
  sortField?: string;

  @ApiPropertyOptional({
    description: 'Orden de clasificación',
    enum: SortOrder,
    example: SortOrder.ASC,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order must be either ASC or DESC' })
  sortOrder?: SortOrder = SortOrder.ASC;
}
