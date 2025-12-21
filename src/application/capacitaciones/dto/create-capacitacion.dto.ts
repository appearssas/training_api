import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';
import { CreateEvaluacionInlineDto } from './create-evaluacion-inline.dto';

export class CreateCapacitacionDto {
  @ApiProperty({
    description: 'Título de la capacitación',
    example: 'Desarrollo Web con React',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @Length(1, 500)
  titulo: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de la capacitación',
    example: 'Curso completo de desarrollo web con React y TypeScript',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: 'ID del tipo de capacitación',
    example: 1,
  })
  @IsInt()
  tipoCapacitacionId: number;

  @ApiProperty({
    description: 'ID de la modalidad de capacitación',
    example: 1,
  })
  @IsInt()
  modalidadId: number;

  @ApiProperty({
    description: 'ID del instructor asignado',
    example: 1,
  })
  @IsInt()
  instructorId: number;

  @ApiPropertyOptional({
    description: 'ID del área temática',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  areaId?: number;

  @ApiPropertyOptional({
    description: 'Público objetivo de la capacitación',
    example: 'Desarrolladores junior y estudiantes',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  publicoObjetivo?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio (formato ISO)',
    example: '2025-01-15',
  })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de finalización (formato ISO)',
    example: '2025-03-15',
  })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({
    description: 'Duración en horas',
    example: 40,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duracionHoras?: number;

  @ApiPropertyOptional({
    description: 'Capacidad máxima de estudiantes',
    example: 30,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacidadMaxima?: number;

  @ApiPropertyOptional({
    description: 'URL de la imagen de portada',
    example: 'https://example.com/images/capacitacion.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  imagenPortadaUrl?: string;

  @ApiPropertyOptional({
    description: 'URL del video promocional',
    example: 'https://example.com/videos/promocional.mp4',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  videoPromocionalUrl?: string;

  @ApiPropertyOptional({
    description: 'Porcentaje mínimo de aprobación',
    example: 70,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minimoAprobacion?: number;

  @ApiPropertyOptional({
    description: 'Estado de la capacitación',
    enum: EstadoCapacitacion,
    example: EstadoCapacitacion.BORRADOR,
  })
  @IsOptional()
  @IsEnum(EstadoCapacitacion)
  estado?: EstadoCapacitacion;

  @ApiPropertyOptional({
    description: 'Usuario que crea la capacitación',
    example: 'admin@example.com',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  usuarioCreacion?: string;

  @ApiPropertyOptional({
    description: 'Datos de la evaluación a crear junto con la capacitación (opcional)',
    type: CreateEvaluacionInlineDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateEvaluacionInlineDto)
  evaluacion?: CreateEvaluacionInlineDto;
}
