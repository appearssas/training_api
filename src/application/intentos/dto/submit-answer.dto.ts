import {
  IsInt,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateIf,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para guardar una respuesta del estudiante
 * Soporta diferentes tipos de preguntas:
 * - Única respuesta: opcionRespuestaId
 * - Múltiple respuesta: opcionRespuestaIds[]
 * - Respuesta abierta: textoRespuesta
 */
export class SubmitAnswerDto {
  @ApiProperty({
    description: 'ID de la pregunta a la que se está respondiendo',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  preguntaId: number;

  @ApiPropertyOptional({
    description:
      'ID de la opción seleccionada (para preguntas de única respuesta)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @ValidateIf(o => !o.opcionRespuestaIds && !o.textoRespuesta)
  opcionRespuestaId?: number;

  @ApiPropertyOptional({
    description:
      'IDs de las opciones seleccionadas (para preguntas de múltiple respuesta)',
    example: [1, 3, 5],
    type: [Number],
    minItems: 1,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  @ValidateIf(o => !o.opcionRespuestaId && !o.textoRespuesta)
  opcionRespuestaIds?: number[];

  @ApiPropertyOptional({
    description: 'Texto de la respuesta (para respuestas abiertas)',
    example: 'Mi respuesta personalizada',
    maxLength: 5000,
  })
  @IsOptional()
  @ValidateIf(o => !o.opcionRespuestaId && !o.opcionRespuestaIds)
  textoRespuesta?: string;
}
