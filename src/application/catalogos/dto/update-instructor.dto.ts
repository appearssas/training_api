import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInstructorDto {
  @ApiPropertyOptional({ description: 'Especialidad del instructor', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  especialidad?: string | null;

  @ApiPropertyOptional({
    description: 'Rol mostrado en certificado (ej: Instructor / Entrenador)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  rol?: string | null;

  @ApiPropertyOptional({
    description: 'Tarjeta profesional (ej: TSA RM 30937322)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tarjetaProfesional?: string | null;

  @ApiPropertyOptional({ description: 'Licencia (ej: Licencia SST)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  licencia?: string | null;

  @ApiPropertyOptional({ description: 'Biografía' })
  @IsOptional()
  @IsString()
  biografia?: string | null;
}
