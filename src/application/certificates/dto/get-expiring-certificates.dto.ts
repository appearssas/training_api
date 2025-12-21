import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum CertificateExpirationStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
}

export class GetExpiringCertificatesDto {
  @ApiPropertyOptional({
    description: 'Fecha inicial del rango de vencimiento',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fechaVencimientoDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha final del rango de vencimiento',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  fechaVencimientoHasta?: string;

  @ApiPropertyOptional({
    description: 'Estado del certificado',
    enum: CertificateExpirationStatus,
    example: CertificateExpirationStatus.EXPIRING_SOON,
  })
  @IsOptional()
  @IsEnum(CertificateExpirationStatus)
  estado?: CertificateExpirationStatus;

  @ApiPropertyOptional({
    description: 'Término de búsqueda (alumno, curso, número certificado)',
    example: 'Juan',
  })
  @IsOptional()
  busqueda?: string;

  @ApiPropertyOptional({
    description: 'Página (paginación)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  pagina?: number;

  @ApiPropertyOptional({
    description: 'Límite de resultados por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  limite?: number;
}
