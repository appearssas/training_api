import { ApiProperty } from '@nestjs/swagger';

export class ConfiguracionSesionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: 30,
    nullable: true,
    description: 'Tiempo de inactividad en minutos',
  })
  tiempoInactividadMinutos: number | null;

  @ApiProperty({
    example: 60,
    nullable: true,
    description: 'Tiempo máximo de sesión en minutos (máximo 60)',
  })
  tiempoMaximoSesionMinutos: number | null;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  fechaActualizacion: Date;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      username: { type: 'string', example: 'admin' },
    },
  })
  creadoPor: {
    id: number;
    username: string;
  };
}
