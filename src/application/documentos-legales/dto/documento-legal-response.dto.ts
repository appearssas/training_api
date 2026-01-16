import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentoLegalResponseDto {
  @ApiProperty({
    description: 'ID único del documento legal',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tipo de documento legal',
    example: 'TERMINOS',
    enum: ['TERMINOS', 'POLITICA_PRIVACIDAD', 'POLITICA_DATOS', 'OTRO'],
  })
  tipo: string;

  @ApiProperty({
    description: 'Título del documento legal',
    example: 'Términos y Condiciones de Uso',
  })
  titulo: string;

  @ApiProperty({
    description: 'Contenido del documento legal (HTML o texto)',
    example: '<p>Contenido del documento legal...</p>',
  })
  contenido: string;

  @ApiProperty({
    description: 'Versión del documento',
    example: '1.0',
  })
  version: string;

  @ApiProperty({
    description: 'Indica si el documento requiere firma digital',
    example: false,
  })
  requiereFirmaDigital: boolean;

  @ApiProperty({
    description: 'Estado activo del documento',
    example: true,
  })
  activo: boolean;

  @ApiProperty({
    description: 'Fecha de creación del documento',
    example: '2025-01-15T10:30:00.000Z',
  })
  fechaCreacion: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del documento',
    example: '2025-01-15T10:30:00.000Z',
  })
  fechaActualizacion: Date;

  @ApiPropertyOptional({
    description: 'Información del usuario que creó el documento',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      username: { type: 'string', example: 'admin' },
      nombres: { type: 'string', example: 'Juan' },
      apellidos: { type: 'string', example: 'Pérez' },
    },
  })
  creadoPor?: {
    id: number;
    username: string;
    nombres?: string;
    apellidos?: string;
  };
}
