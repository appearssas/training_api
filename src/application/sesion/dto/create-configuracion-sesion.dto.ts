import {
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConfiguracionSesionDto {
  @ApiPropertyOptional({
    description:
      'Tiempo de inactividad en minutos antes de cerrar sesión. Si es null, la funcionalidad está deshabilitada.',
    example: 30,
    minimum: 5,
    maximum: 120,
  })
  @IsOptional()
  @IsInt({ message: 'El tiempo de inactividad debe ser un número entero' })
  @Min(5, { message: 'El tiempo mínimo de inactividad es 5 minutos' })
  @Max(120, { message: 'El tiempo máximo de inactividad es 120 minutos' })
  tiempoInactividadMinutos?: number | null;

  @ApiPropertyOptional({
    description:
      'Tiempo máximo de sesión en minutos (máximo 60 minutos = 1 hora). Si es null, la funcionalidad está deshabilitada.',
    example: 60,
    minimum: 15,
    maximum: 60,
  })
  @IsOptional()
  @IsInt({ message: 'El tiempo máximo de sesión debe ser un número entero' })
  @Min(15, { message: 'El tiempo mínimo de sesión es 15 minutos' })
  @Max(60, { message: 'El tiempo máximo de sesión es 60 minutos (1 hora)' })
  tiempoMaximoSesionMinutos?: number | null;

  @ApiPropertyOptional({
    description: 'Indica si la configuración está activa',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo?: boolean;
}
