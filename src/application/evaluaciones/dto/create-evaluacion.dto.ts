import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Length,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear una opción de respuesta
 */
export class CreateOpcionRespuestaDto {
  @ApiProperty({
    description: 'Texto de la opción de respuesta',
    example: 'Opción A',
  })
  @IsString()
  @Length(1, 1000)
  texto: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen para esta opción de respuesta',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  imagenUrl?: string;

  @ApiProperty({
    description: 'Indica si esta opción es correcta',
    example: false,
  })
  @IsBoolean()
  esCorrecta: boolean;

  @ApiPropertyOptional({
    description:
      'Puntaje parcial para esta opción (útil en múltiple respuesta)',
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
 * DTO para crear una pregunta
 */
export class CreatePreguntaDto {
  @ApiProperty({
    description:
      'ID del tipo de pregunta (1: Única respuesta, 2: Múltiple, 3: Imagen, 4: Falso/Verdadero, 5: Sí/No)',
    example: 1,
  })
  @IsInt()
  tipoPreguntaId: number;

  @ApiProperty({
    description: 'Enunciado de la pregunta',
    example: '¿Cuál es la capital de Colombia?',
  })
  @IsString()
  @Length(1, 2000)
  enunciado: string;

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

  @ApiProperty({
    type: [CreateOpcionRespuestaDto],
    description: 'Opciones de respuesta para la pregunta',
  })
  @ArrayMinSize(1, {
    message: 'Cada pregunta debe tener al menos una opción de respuesta',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateOpcionRespuestaDto)
  opciones: CreateOpcionRespuestaDto[];
}

/**
 * DTO para crear una evaluación
 */
export class CreateEvaluacionDto {
  @ApiProperty({
    description: 'ID de la capacitación a la que pertenece la evaluación',
    example: 1,
  })
  @IsInt()
  capacitacionId: number;

  @ApiProperty({
    description: 'Título de la evaluación',
    example: 'Evaluación Final de React',
  })
  @IsString()
  @Length(1, 300)
  titulo: string;

  @ApiPropertyOptional({
    description: 'Descripción de la evaluación',
    example: 'Evaluación para medir conocimientos en React',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Tiempo límite en minutos para completar la evaluación',
    example: 60,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  tiempoLimiteMinutos?: number;

  @ApiPropertyOptional({
    description: 'Número de intentos permitidos',
    example: 2,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  intentosPermitidos?: number;

  @ApiPropertyOptional({
    description: 'Indica si se muestran los resultados al finalizar',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  mostrarResultados?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si se muestran las respuestas correctas al finalizar',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  mostrarRespuestasCorrectas?: boolean;

  @ApiPropertyOptional({
    description: 'Puntaje total de la evaluación',
    example: 100,
    minimum: 0,
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  puntajeTotal?: number;

  @ApiPropertyOptional({
    description: 'Porcentaje mínimo para aprobar la evaluación',
    example: 70,
    minimum: 0,
    maximum: 100,
    default: 70,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minimoAprobacion?: number;

  @ApiPropertyOptional({
    description: 'Orden de la evaluación',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @ApiProperty({
    type: [CreatePreguntaDto],
    description: 'Lista de preguntas de la evaluación',
  })
  @ArrayMinSize(1, {
    message: 'La evaluación debe tener al menos una pregunta',
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePreguntaDto)
  preguntas: CreatePreguntaDto[];
}
