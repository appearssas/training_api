import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOpcionRespuestaDto {
  @ApiProperty({
    description: 'Texto de la opción de respuesta',
    example: 'React',
    maxLength: 1000,
  })
  @IsString()
  @Length(1, 1000)
  texto: string;

  @ApiProperty({
    description: 'Indica si esta opción es correcta',
    example: true,
  })
  @IsBoolean()
  esCorrecta: boolean;

  @ApiPropertyOptional({
    description: 'Puntaje parcial de esta opción (para respuestas múltiples)',
    example: 0.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  puntajeParcial?: number;

  @ApiPropertyOptional({
    description: 'Orden de la opción',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}

export class CreatePreguntaDto {
  @ApiProperty({
    description: 'ID del tipo de pregunta (1: única, 2: múltiple, 3: imagen, 4: verdadero/falso, 5: sí/no)',
    example: 1,
  })
  @IsInt()
  tipoPreguntaId: number;

  @ApiProperty({
    description: 'Enunciado de la pregunta',
    example: '¿Cuál es el framework más popular para React?',
  })
  @IsString()
  @Length(1, 10000)
  enunciado: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen (para preguntas de tipo imagen)',
    example: 'https://example.com/image.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  imagenUrl?: string;

  @ApiPropertyOptional({
    description: 'Puntaje de la pregunta',
    example: 10.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  puntaje?: number;

  @ApiPropertyOptional({
    description: 'Orden de la pregunta',
    example: 1,
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
    description: 'Opciones de respuesta para la pregunta',
    type: [CreateOpcionRespuestaDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpcionRespuestaDto)
  opciones: CreateOpcionRespuestaDto[];
}

export class CreateEvaluacionInlineDto {
  @ApiProperty({
    description: 'Título de la evaluación',
    example: 'Evaluación Final - Desarrollo Web con React',
    maxLength: 300,
  })
  @IsString()
  @Length(1, 300)
  titulo: string;

  @ApiPropertyOptional({
    description: 'Descripción de la evaluación',
    example: 'Evaluación que cubre todos los temas del curso',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Tiempo límite en minutos (null = sin límite)',
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
    description: 'Indica si se muestran las respuestas correctas',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  mostrarRespuestasCorrectas?: boolean;

  @ApiPropertyOptional({
    description: 'Puntaje total de la evaluación',
    example: 100.0,
    minimum: 0,
    default: 100.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  puntajeTotal?: number;

  @ApiPropertyOptional({
    description: 'Porcentaje mínimo de aprobación',
    example: 70.0,
    minimum: 0,
    maximum: 100,
    default: 70.0,
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
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @ApiProperty({
    description: 'Preguntas de la evaluación (mínimo 1 según RF-08)',
    type: [CreatePreguntaDto],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePreguntaDto)
  preguntas: CreatePreguntaDto[];
}

