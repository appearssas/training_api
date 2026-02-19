import {
  IsInt,
  IsPositive,
  Min,
  Max,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResenaDto {
  @ApiProperty({
    description: 'ID de la inscripción a la cual se asocia la reseña',
    example: 1,
    type: Number,
  })
  @IsInt({ message: 'El ID de la inscripción debe ser un número entero' })
  @IsPositive({ message: 'El ID de la inscripción debe ser positivo' })
  inscripcionId: number;

  @ApiProperty({
    description: 'Calificación de la capacitación (1-5 estrellas)',
    example: 5,
    type: Number,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  calificacion: number;

  @ApiPropertyOptional({
    description: 'Comentario opcional sobre la capacitación',
    example: 'Excelente capacitación, muy completa y bien estructurada.',
    type: String,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'El comentario debe ser un texto' })
  @MaxLength(1000, {
    message: 'El comentario no puede exceder 1000 caracteres',
  })
  comentario?: string;
}
