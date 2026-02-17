import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsInt,
  Min,
  Max,
  Length,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';
import { CreateEvaluacionInlineDto } from './create-evaluacion-inline.dto';
import { IsStrictEnum } from '@/infrastructure/shared/decorators/strict-enum.decorator';

/**
 * IDs válidos de tipos de capacitación
 * STANDARD = 1, CERTIFIED = 2, SURVEY = 3
 */
const VALID_TRAINING_TYPE_IDS = [1, 2, 3] as const;

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
    description: 'ID del tipo de capacitación (1=STANDARD, 2=CERTIFIED, 3=SURVEY)',
    example: 1,
    enum: [1, 2, 3],
  })
  @IsInt()
  @IsIn(VALID_TRAINING_TYPE_IDS, {
    message: 'tipoCapacitacionId debe ser uno de los valores válidos: 1 (STANDARD), 2 (CERTIFIED), 3 (SURVEY)',
  })
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
    description: 'ID del ente certificador (ej. ministerio, secretaría de tránsito)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  enteCertificadorId?: number;

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
    description: 'Tipo de certificado (formato PDF y fondo: alimentos, sustancias, otros). Si no se envía, se infiere del título.',
    enum: ['alimentos', 'sustancias', 'otros'],
    example: 'otros',
  })
  @IsOptional()
  @IsIn(['alimentos', 'sustancias', 'otros'])
  tipoCertificado?: 'alimentos' | 'sustancias' | 'otros' | null;

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
  @IsStrictEnum(EstadoCapacitacion, {
    message: 'estado debe ser uno de los valores permitidos: borrador, publicada, en_curso, finalizada, cancelada',
  })
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
