import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificadosController } from './certificados.controller';
import { PublicCertificadosController } from './public-certificados.controller';
import { CertificadosRepositoryAdapter } from './certificados.repository.adapter';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { AuditoriaCertificadoRetroactivo } from '@/entities/auditoria/auditoria-certificado-retroactivo.entity';
import { CreateCertificadoUseCase } from '@/application/certificados/use-cases/create-certificado.use-case';
import { FindAllCertificadosUseCase } from '@/application/certificados/use-cases/find-all-certificados.use-case';
import { FindOneCertificadoUseCase } from '@/application/certificados/use-cases/find-one-certificado.use-case';
import { FindByEstudianteCertificadosUseCase } from '@/application/certificados/use-cases/find-by-estudiante-certificados.use-case';
import { VerifyCertificadoUseCase } from '@/application/certificados/use-cases/verify-certificado.use-case';
import { UpdateCertificadoRetroactivoUseCase } from '@/application/certificados/use-cases/update-certificado-retroactivo.use-case';
import { RegenerateCertificatesUseCase } from '@/application/certificados/use-cases/regenerate-certificates.use-case';
import { PdfGeneratorService } from '../shared/services/pdf-generator.service';
import { QrGeneratorService } from '../shared/services/qr-generator.service';

/**
 * Módulo de Certificados
 * RF-22 a RF-34: Gestión completa de certificados
 */
@Module({
  controllers: [CertificadosController, PublicCertificadosController],
  providers: [
    CreateCertificadoUseCase,
    FindAllCertificadosUseCase,
    FindOneCertificadoUseCase,
    FindByEstudianteCertificadosUseCase,
    VerifyCertificadoUseCase,
    UpdateCertificadoRetroactivoUseCase,
    RegenerateCertificatesUseCase,
    PdfGeneratorService,
    QrGeneratorService,
    {
      provide: 'ICertificadosRepository',
      useClass: CertificadosRepositoryAdapter,
    },
  ],
  imports: [
    TypeOrmModule.forFeature([
      Certificado,
      Inscripcion,
      AuditoriaCertificadoRetroactivo,
    ]),
  ],
  exports: [
    CreateCertificadoUseCase,
    FindAllCertificadosUseCase,
    FindOneCertificadoUseCase,
    FindByEstudianteCertificadosUseCase,
    VerifyCertificadoUseCase,
    PdfGeneratorService,
    QrGeneratorService,
    'ICertificadosRepository',
  ],
})
export class CertificadosModule {}

