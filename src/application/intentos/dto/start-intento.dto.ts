import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para iniciar un intento de evaluación
 * Valida que se proporcione una inscripción válida
 */
export class StartIntentoDto {
  @ApiProperty({
    description: 'ID de la inscripción del estudiante a la capacitación',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  inscripcionId: number;
}
