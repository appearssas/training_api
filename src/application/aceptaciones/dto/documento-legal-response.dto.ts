import { ApiProperty } from '@nestjs/swagger';

export class DocumentoLegalActivoResponseDto {
  @ApiProperty({
    description:
      'ID único del documento legal. Este ID debe ser usado al aceptar términos.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description:
      'Tipo de documento legal. Valores comunes: TERMINOS_CONDICIONES, POLITICA_PRIVACIDAD',
    example: 'TERMINOS_CONDICIONES',
    enum: ['TERMINOS_CONDICIONES', 'POLITICA_PRIVACIDAD'],
  })
  tipo: string;

  @ApiProperty({
    description: 'Título descriptivo del documento legal',
    example: 'Términos y Condiciones de Uso',
  })
  titulo: string;

  @ApiProperty({
    description:
      'Contenido completo del documento legal en formato texto. Este es el texto que el usuario debe leer y aceptar.',
    example:
      'TÉRMINOS Y CONDICIONES DE USO\n\n1. ACEPTACIÓN DE TÉRMINOS\nAl acceder y utilizar esta plataforma...',
  })
  contenido: string;

  @ApiProperty({
    description:
      'Versión del documento. Se incrementa cuando se actualiza el contenido. La versión aceptada por el usuario queda registrada.',
    example: '1.0',
  })
  version: string;

  @ApiProperty({
    description:
      'Indica si este documento requiere firma digital para su aceptación. Actualmente no implementado.',
    example: false,
  })
  requiereFirmaDigital: boolean;

  @ApiProperty({
    description:
      'Indica si el documento está activo. Solo los documentos activos deben ser aceptados por los usuarios.',
    example: true,
  })
  activo: boolean;
}
