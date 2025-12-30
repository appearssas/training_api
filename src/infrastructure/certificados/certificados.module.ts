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
import { StorageService } from '../shared/services/storage.service';
import { S3Service } from '../shared/services/s3.service';
import { ConfigService } from '@nestjs/config';

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
      provide: S3Service,
      useFactory: (configService: ConfigService) => {
        // Solo crear S3Service si las variables de entorno están configuradas
        const bucketName = configService.get<string>('AWS_S3_BUCKET_NAME');
        const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');
        
        if (bucketName && accessKeyId && secretAccessKey) {
          try {
            return new S3Service(configService);
          } catch (error) {
            console.warn('⚠️ S3Service no se pudo inicializar, usando almacenamiento local:', error);
            return null;
          }
        }
        return null;
      },
      inject: [ConfigService],
    },
    StorageService,
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

