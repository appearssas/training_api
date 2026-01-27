import { PartialType } from '@nestjs/mapped-types';
import { CreateCertificateFormatDto } from './create-certificate-format.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCertificateFormatDto extends PartialType(
  CreateCertificateFormatDto,
) {
  @ApiPropertyOptional({
    description: 'Indica si el formato está activo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
