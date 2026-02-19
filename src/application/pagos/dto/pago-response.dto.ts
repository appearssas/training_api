import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PagoResponseDto {
  @ApiProperty({ description: 'ID del pago', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID del estudiante', example: 1 })
  estudianteId: number;

  @ApiProperty({ description: 'Monto del pago', example: 150000.0 })
  monto: number;

  @ApiProperty({
    description: 'Método de pago',
    example: 'Transferencia bancaria',
  })
  metodoPago: string;

  @ApiPropertyOptional({
    description: 'Número de comprobante',
    example: 'COMP-2025-001',
  })
  numeroComprobante?: string;

  @ApiProperty({
    description: 'Fecha del pago',
    example: '2025-01-15T10:30:00.000Z',
  })
  fechaPago: Date;

  @ApiProperty({
    description: 'ID del usuario que registró el pago',
    example: 1,
  })
  registradoPorId: number;

  @ApiPropertyOptional({
    description: 'Observaciones',
    example: 'Pago realizado mediante transferencia bancaria',
  })
  observaciones?: string;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-01-15T10:30:00.000Z',
  })
  fechaCreacion: Date;
}
