import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Respuesta del endpoint de completar capacitaciones de un usuario (admin).
 */
export class CompleteUserTrainingsResponseDto {
  @ApiProperty({
    description: 'ID del usuario procesado',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'Cantidad de inscripciones procesadas exitosamente',
    example: 3,
  })
  inscripcionesProcesadas: number;

  @ApiProperty({
    description: 'Mensaje resumen',
    example: 'Se completaron 3 capacitaciones para el usuario.',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Errores por inscripción (si los hubo)',
    type: [String],
    example: ['Inscripción 5: No hay intentos disponibles.'],
  })
  errors?: string[];
}
