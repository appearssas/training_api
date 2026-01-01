import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateCertificadoUseCase } from './create-certificado.use-case';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { EstadoInscripcion } from '@/entities/inscripcion/types';
import { PdfGeneratorService } from '@/infrastructure/shared/services/pdf-generator.service';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '@/infrastructure/shared/services/storage.service';

interface RegenerationResult {
  totalAprobados: number;
  yaTenianCertificado: number;
  generados: number;
  errores: number;
  detallesErrores: string[];
}

@Injectable()
export class RegenerateCertificatesUseCase {
  private readonly logger = new Logger(RegenerateCertificatesUseCase.name);

  constructor(
    private readonly createCertificadoUseCase: CreateCertificadoUseCase,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: any,
  ) {}

  async execute(): Promise<RegenerationResult> {
    this.logger.log('Iniciando regeneración masiva de certificados');
    
    // 1. Buscar todas las inscripciones aprobadas
    const inscripcionesAprobadas = await this.inscripcionRepository.find({
      where: [
        { estado: EstadoInscripcion.COMPLETADO, aprobado: true },
        { estado: EstadoInscripcion.EN_PROGRESO, aprobado: true }
      ],
      relations: ['certificados', 'capacitacion', 'capacitacion.tipoCapacitacion', 'estudiante'],
    });

    const result: RegenerationResult = {
      totalAprobados: inscripcionesAprobadas.length,
      yaTenianCertificado: 0,
      generados: 0,
      errores: 0,
      detallesErrores: [],
    };

    for (const inscripcion of inscripcionesAprobadas) {
      const tipoCapacitacion = inscripcion.capacitacion?.tipoCapacitacion?.codigo?.toUpperCase();
      if (tipoCapacitacion !== 'CERTIFIED') {
        continue;
      }

      const cert = inscripcion.certificados && inscripcion.certificados.length > 0
         ? inscripcion.certificados[0] : null;

      if (cert) {
        this.logger.log(`Regenerating PDF for Inscripcion ${inscripcion.id}`);
        try {
            cert.inscripcion = inscripcion;
            const pdfBuffer = await this.pdfGenerator.generateCertificate(cert);
            const newPath = await this.savePdf(cert.id, pdfBuffer);
            
            // Use update instead of save, matching CreateCertificadoUseCase
            await this.certificadosRepository.update(cert.id, {
                urlCertificado: newPath
            });
            
            this.logger.log(`PDF Regenerado y URL actualizada para certificado ID: ${cert.id}`);
            result.generados++; 
        } catch (error) {
            this.logger.error(`Error regenerando PDF para inscripción ${inscripcion.id}`, error);
            result.errores++;
            if (error instanceof Error) result.detallesErrores.push(`Regen Inscripcion ${inscripcion.id}: ${error.message}`);
        }
        result.yaTenianCertificado++;
      } else {
        // Generar nuevo
        try {
            await this.createCertificadoUseCase.execute({
              inscripcionId: inscripcion.id,
              emitidoPor: 1,
            });
            result.generados++;
            this.logger.log(`Certificado generado para inscripción ID: ${inscripcion.id}`);
        } catch (error) {
            result.errores++;
            const errMsg = error instanceof Error ? error.message : 'Error desconocido';
            result.detallesErrores.push(`Inscripcion ${inscripcion.id}: ${errMsg}`);
            this.logger.error(`Error generando certificado para inscripción ${inscripcion.id}`, error);
        }
      }
    }

    this.logger.log('Regeneración finalizada', result);
    return result;
  }

  /* Helper para guardar PDF usando StorageService */
  private async savePdf(certificadoId: number | string, pdfBuffer: Buffer): Promise<string> {
    const fileName = `certificado-${certificadoId}-${Date.now()}.pdf`;
    
    const url = await this.storageService.saveBuffer(
      pdfBuffer,
      fileName,
      'certificates',
      'application/pdf',
    );

    // Si es URL relativa, devolverla tal cual está en la BD o ajustar según necesidad.
    // CreateCertificadoUseCase prepends baseUrl, pero PublicCertificadosController espera nombre de archivo o path.
    // Si StorageService retorna `/storage/certificates/file.pdf`.
    
    // PublicCertificadosController busca en `/storage/certificates/filename`.
    // Si url es completa (http...), no sirve para path local.
    // Pero asumo local storage.
    
    // CreateCertificadoUseCase logic:
    // if (url.startsWith('/storage/')) return `${baseUrl}${url}`;
    
    // I should probably store the relative path for consistency if frontend expects full URL.
    // BUT, backend serving files needs local path.
    // The current problem started because urlCertificado was NOT being served.
    
    // I will return the URL from storageService.
    // If it's relative, it works.
    return url; 
  }
}
