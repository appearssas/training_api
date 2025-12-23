import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserSortField {
  ID = 'id',
  USERNAME = 'username',
  FECHA_CREACION = 'fechaCreacion',
  ULTIMO_ACCESO = 'ultimoAcceso',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ListUsersDto {
  @ApiProperty({
    description: 'Número de página (comienza en 1)',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Cantidad de elementos por página',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Búsqueda por nombre de usuario, email o número de documento',
    example: 'juan',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filtrar por rol',
    example: 'ADMIN',
    required: false,
    enum: ['ADMIN', 'CLIENTE', 'INSTRUCTOR', 'ALUMNO', 'OPERADOR'],
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({
    description: 'Filtrar por estado de habilitación',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  habilitado?: boolean;

  @ApiProperty({
    description: 'Filtrar por estado activo',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activo?: boolean;

  @ApiProperty({
    description: 'Campo por el cual ordenar',
    example: 'fechaCreacion',
    required: false,
    enum: UserSortField,
    default: UserSortField.FECHA_CREACION,
  })
  @IsOptional()
  @IsEnum(UserSortField)
  sortBy?: UserSortField = UserSortField.FECHA_CREACION;

  @ApiProperty({
    description: 'Orden de clasificación',
    example: 'DESC',
    required: false,
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

