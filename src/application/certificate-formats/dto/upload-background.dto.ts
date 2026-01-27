import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CertificateFormatType } from '@/entities/certificate-formats/certificate-format.entity';

export class UploadBackgroundDto {
  @ApiProperty({
    enum: CertificateFormatType,
    description: 'Tipo de formato para el cual se sube el fondo',
    example: CertificateFormatType.OTROS,
  })
  @IsEnum(CertificateFormatType)
  @IsNotEmpty()
  tipo: CertificateFormatType;
}
