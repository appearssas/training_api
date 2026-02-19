import { PartialType } from '@nestjs/swagger';
import { CreateMaterialDto } from './create-material.dto';
import { IsOptional, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {
  @ApiPropertyOptional({
    description: 'ID del tipo de material',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  tipoMaterialId?: number;

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo del material',
    example: true,
  })
  @IsOptional()
  activo?: boolean;
}
