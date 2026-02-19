import { PartialType } from '@nestjs/swagger';
import { CreateInscripcionDto } from './create-inscripcion.dto';
import {
  IsOptional,
  IsEnum,
  IsDecimal,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoInscripcion } from '@/entities/inscripcion/types';

export class UpdateInscripcionDto extends PartialType(CreateInscripcionDto) {
  @ApiPropertyOptional({
    description: 'Estado de la inscripción',
    enum: EstadoInscripcion,
    example: EstadoInscripcion.EN_PROGRESO,
  })
  @IsOptional()
  @IsEnum(EstadoInscripcion, {
    message: `El estado debe ser uno de: ${Object.values(EstadoInscripcion).join(', ')}`,
  })
  estado?: EstadoInscripcion;

  @ApiPropertyOptional({
    description: 'Porcentaje de progreso del curso (0-100)',
    example: 45.5,
    type: Number,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'El progreso debe ser un número decimal' },
  )
  @Min(0, { message: 'El progreso no puede ser menor a 0' })
  @Max(100, { message: 'El progreso no puede ser mayor a 100' })
  progresoPorcentaje?: number;

  @ApiPropertyOptional({
    description: 'Fecha de finalización del curso para el estudiante',
    example: '2025-02-15T18:00:00Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'La fecha de finalización debe tener un formato válido (ISO 8601)',
    },
  )
  fechaFinalizacion?: Date;

  @ApiPropertyOptional({
    description: 'Calificación final obtenida en el curso',
    example: 85.5,
    type: Number,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'La calificación debe ser un número decimal' },
  )
  @Min(0, { message: 'La calificación no puede ser menor a 0' })
  @Max(100, { message: 'La calificación no puede ser mayor a 100' })
  calificacionFinal?: number;

  @ApiPropertyOptional({
    description: 'Indica si el estudiante aprobó el curso',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo aprobado debe ser un valor booleano' })
  aprobado?: boolean;
}
