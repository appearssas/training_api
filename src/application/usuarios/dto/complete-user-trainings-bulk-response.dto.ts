import { ApiProperty } from '@nestjs/swagger';
import { CompleteUserTrainingsResponseDto } from './complete-user-trainings-response.dto';

/**
 * Respuesta del endpoint de completar capacitaciones para varios usuarios (admin).
 */
export class CompleteUserTrainingsBulkResponseDto {
  @ApiProperty({
    description: 'Resultado por cada usuario procesado',
    type: [CompleteUserTrainingsResponseDto],
  })
  results: CompleteUserTrainingsResponseDto[];

  @ApiProperty({
    description: 'Total de usuarios procesados',
    example: 3,
  })
  totalProcessed: number;

  @ApiProperty({
    description: 'Usuarios procesados con al menos una inscripción completada',
    example: 2,
  })
  totalSuccess: number;

  @ApiProperty({
    description:
      'Usuarios que no pudieron procesarse (ej. no encontrados, sin persona)',
    example: 1,
  })
  totalErrors: number;
}
