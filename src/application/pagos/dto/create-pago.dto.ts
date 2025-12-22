import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePagoDto {
  @ApiProperty({
    description: 'ID del conductor externo (estudiante)',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  estudianteId: number;

  @ApiProperty({
    description: 'Monto del pago',
    example: 150000.00,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  monto: number;

  @ApiProperty({
    description: 'Método de pago',
    example: 'Transferencia bancaria',
  })
  @IsString()
  @IsNotEmpty()
  metodoPago: string;

  @ApiPropertyOptional({
    description: 'Fecha del pago (formato ISO). Si no se proporciona, se usa la fecha actual',
    example: '2025-01-15',
  })
  @IsDateString()
  @IsOptional()
  fechaPago?: string;

  @ApiPropertyOptional({
    description: 'Número de comprobante de pago',
    example: 'COMP-2025-001',
  })
  @IsString()
  @IsOptional()
  numeroComprobante?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales sobre el pago',
    example: 'Pago realizado mediante transferencia bancaria',
  })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

