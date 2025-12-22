import { ApiProperty } from '@nestjs/swagger';

export class CargaMasivaResponseDto {
  @ApiProperty({
    description: 'Número total de filas procesadas',
    example: 10,
  })
  totalFilas: number;

  @ApiProperty({
    description: 'Número de conductores registrados exitosamente',
    example: 8,
  })
  registradosExitosos: number;

  @ApiProperty({
    description: 'Número de filas con errores',
    example: 2,
  })
  filasConErrores: number;

  @ApiProperty({
    description: 'Detalle de errores por fila',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        fila: { type: 'number', example: 3 },
        error: { type: 'string', example: 'El número de documento ya está registrado' },
        datos: { type: 'object' },
      },
    },
    example: [
      {
        fila: 3,
        error: 'El número de documento ya está registrado',
        datos: {
          numeroDocumento: '1234567890',
          nombres: 'Juan',
          apellidos: 'Pérez',
        },
      },
    ],
  })
  errores: Array<{
    fila: number;
    error: string;
    datos: any;
  }>;
}

