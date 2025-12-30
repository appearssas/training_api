import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEvaluacionDto, CreatePreguntaDto, CreateOpcionRespuestaDto } from './create-evaluacion.dto';
import { IsOptional, IsInt, Min, IsString, IsBoolean, IsNumber, Length, ValidateNested, ArrayMinSize } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para actualizar una opción de respuesta
 * Define explícitamente todos los campos para asegurar que los decoradores funcionen correctamente
 */
export class UpdateOpcionRespuestaDto {
  @ApiPropertyOptional({
    description: 'ID de la opción de respuesta (solo para actualización)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({
    description: 'Texto de la opción de respuesta',
    example: 'Opción A',
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  texto?: string;

  @ApiPropertyOptional({
    description: 'Indica si esta opción es correcta',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  esCorrecta?: boolean;

  @ApiPropertyOptional({
    description: 'Puntaje parcial para esta opción (útil en múltiple respuesta)',
    example: 0.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  puntajeParcial?: number;

  @ApiPropertyOptional({
    description: 'Orden de la opción',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}

/**
 * DTO para actualizar una pregunta
 * Define explícitamente todos los campos para asegurar que los decoradores funcionen correctamente
 */
export class UpdatePreguntaDto {
  @ApiPropertyOptional({
    description: 'ID de la pregunta (solo para actualización)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({
    description: 'ID del tipo de pregunta (1: Única respuesta, 2: Múltiple, 3: Imagen, 4: Falso/Verdadero, 5: Sí/No)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  tipoPreguntaId?: number;

  @ApiPropertyOptional({
    description: 'Enunciado de la pregunta',
    example: '¿Cuál es la capital de Colombia?',
  })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  enunciado?: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen para preguntas de tipo imagen',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  imagenUrl?: string;

  @ApiPropertyOptional({
    description: 'Puntaje que otorga esta pregunta',
    example: 1,
    minimum: 0,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  puntaje?: number;

  @ApiPropertyOptional({
    description: 'Orden de la pregunta',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @ApiPropertyOptional({
    description: 'Indica si la pregunta es requerida',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  requerida?: boolean;

  @ApiPropertyOptional({
    type: [UpdateOpcionRespuestaDto],
    description: 'Opciones de respuesta para la pregunta',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateOpcionRespuestaDto)
  opciones?: UpdateOpcionRespuestaDto[];
}

/**
 * DTO para actualizar una evaluación
 * Extiende CreateEvaluacionDto haciendo todos los campos opcionales
 * Permite actualizar parcialmente la evaluación, incluyendo preguntas y opciones
 * Las preguntas y opciones pueden incluir IDs para actualizar entidades existentes
 */
export class UpdateEvaluacionDto extends PartialType(
  OmitType(CreateEvaluacionDto, ['preguntas', 'capacitacionId'] as const)
) {
  @ApiPropertyOptional({
    type: [UpdatePreguntaDto],
    description: 'Lista de preguntas de la evaluación. Si una pregunta tiene id, se actualiza; si no, se crea nueva.',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdatePreguntaDto)
  preguntas?: UpdatePreguntaDto[];
}
