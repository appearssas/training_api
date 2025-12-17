import {
  IsInt,
  IsOptional,
  Min,
  Max,
  IsEnum,
  IsString,
  IsObject,
} from 'class-validator';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationDto {
  @IsInt({ message: 'Page must be a number' })
  @Min(1, { message: 'Page must be greater than 0' })
  @Max(1000, { message: 'Page cannot exceed 1000' })
  page: number = 1;

  @IsInt({ message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be greater than 0' })
  @Max(100, { message: 'Limit cannot exceed 100 items per page' })
  limit: number = 10;

  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsString({ message: 'Sort field must be a valid column name' })
  sortField?: string;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order must be either ASC or DESC' })
  sortOrder?: SortOrder = SortOrder.ASC;
}
