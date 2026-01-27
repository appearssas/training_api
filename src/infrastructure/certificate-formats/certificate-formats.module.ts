import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificateFormatsController } from './certificate-formats.controller';
import { CertificateFormatsService } from './certificate-formats.service';
import { CertificateFormatsRepositoryAdapter } from './certificate-formats.repository.adapter';
import { CertificateFormat } from '@/entities/certificate-formats/certificate-format.entity';

/**
 * Módulo para gestionar formatos de certificados
 * Permite:
 * - Guardar configuraciones de PDF en base de datos
 * - Subir y actualizar archivos PNG de fondos
 * - Gestionar configuraciones por tipo (alimentos, sustancias, otros)
 */
@Module({
  controllers: [CertificateFormatsController],
  imports: [TypeOrmModule.forFeature([CertificateFormat])],
  providers: [
    CertificateFormatsService,
    CertificateFormatsRepositoryAdapter,
  ],
  exports: [
    CertificateFormatsService,
    CertificateFormatsRepositoryAdapter,
  ],
})
export class CertificateFormatsModule {}
