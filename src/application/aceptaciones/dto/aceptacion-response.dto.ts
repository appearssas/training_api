import { ApiProperty } from '@nestjs/swagger';

export class AceptacionResponseDto {
  @ApiProperty({
    description: 'ID único de la aceptación registrada',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID del documento legal que fue aceptado',
    example: 1,
  })
  documentoLegalId: number;

  @ApiProperty({
    description: 'Versión del documento que fue aceptada. Útil para rastrear cambios en documentos legales.',
    example: '1.0',
  })
  version: string;

  @ApiProperty({
    description: 'Fecha y hora en que el usuario aceptó el documento. Se registra automáticamente.',
    example: '2025-01-15T10:30:00.000Z',
  })
  fechaAceptacion: Date;
}

