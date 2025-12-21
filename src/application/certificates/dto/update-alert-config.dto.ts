import { IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAlertConfigDto {
  @ApiProperty({
    description: 'Días antes del vencimiento para enviar alerta',
    example: 30,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  diasAntesVencimiento: number;

  @ApiProperty({
    description: 'Indica si la alerta está activa',
    example: true,
  })
  @IsBoolean()
  activo: boolean;
}
