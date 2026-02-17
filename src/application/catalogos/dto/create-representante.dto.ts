import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRepresentanteDto {
  @ApiProperty({ description: 'Nombre del representante', example: 'Juan Pérez', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiPropertyOptional({ description: 'Cargo o rol', example: 'Representante legal', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cargo?: string;

  @ApiPropertyOptional({ description: 'Activo', default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
