import {
  IsInt,
  IsOptional,
  IsDateString,
  ValidateIf,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInscripcionDto {
  @ApiProperty({
    description: 'ID de la capacitación a la cual se inscribe el estudiante',
    example: 1,
    type: Number,
  })
  @IsInt({ message: 'El ID de la capacitación debe ser un número entero' })
  @IsPositive({ message: 'El ID de la capacitación debe ser positivo' })
  capacitacionId: number;

  @ApiProperty({
    description: 'ID del estudiante (Persona) que se inscribe',
    example: 1,
    type: Number,
  })
  @IsInt({ message: 'El ID del estudiante debe ser un número entero' })
  @IsPositive({ message: 'El ID del estudiante debe ser positivo' })
  estudianteId: number;

  @ApiPropertyOptional({
    description:
      'ID del pago asociado (requerido solo para conductores externos)',
    example: 1,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.pagoId !== null && o.pagoId !== undefined)
  @IsInt({ message: 'El ID del pago debe ser un número entero' })
  @IsPositive({ message: 'El ID del pago debe ser positivo' })
  pagoId?: number | null;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del curso para el estudiante',
    example: '2025-01-15T08:00:00Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de inicio debe tener un formato válido (ISO 8601)' },
  )
  fechaInicio?: Date;
}
