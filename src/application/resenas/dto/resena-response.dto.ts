import { ApiProperty } from '@nestjs/swagger';

export class ResenaResponseDto {
  @ApiProperty({ description: 'ID de la reseña', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID de la inscripción', example: 1 })
  inscripcionId: number;

  @ApiProperty({
    description: 'Calificación (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  calificacion: number;

  @ApiProperty({
    description: 'Comentario de la reseña',
    example: 'Excelente capacitación',
    nullable: true,
  })
  comentario: string | null;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-01-15T10:30:00Z',
  })
  fechaCreacion: Date;

  @ApiProperty({
    description: 'Indica si la reseña está activa',
    example: true,
  })
  activo: boolean;
}
