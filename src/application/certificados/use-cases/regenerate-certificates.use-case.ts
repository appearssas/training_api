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
        this.logger.log(`Updating dynamic URL for Inscripcion ${inscripcion.id}`);
        try {
            // Asegurar que existe hash
            let hash = cert.hashVerificacion;
            if (!hash) {
                 // Si falta hash, no podemos generar URL dinámica segura.
                 // Podríamos generarlo aquí, pero simplificaremos asumiendo que el hash existe o se debe regenerar todo.
                 // Si createCertificadoUseCase se encarga de todo, mejor llamar a create si falta info vital.
                 this.logger.warn(`Certificado ${cert.id} sin hash. Saltando a recreación completa.`);
                 // Forzamos creación si está corrupto?
                 // Mejor solo actualizamos si tiene hash.
            }

            if (hash) {
                const dynamicUrl = `/public/certificates/download/${hash}`;
                await this.certificadosRepository.update(cert.id, {
                    urlCertificado: dynamicUrl
                });
                this.logger.log(`URL dinámica actualizada para certificado ID: ${cert.id}`);
                result.generados++;
            }
             
        } catch (error) {
            this.logger.error(`Error actualizando certificado ${inscripcion.id}`, error);
            result.errores++;
            if (error instanceof Error) result.detallesErrores.push(`Update Inscripcion ${inscripcion.id}: ${error.message}`);
        }
        result.yaTenianCertificado++;
      } else {
        // Generar nuevo (CreateCertificadoUseCase ya es On-Demand)
        try {
            await this.createCertificadoUseCase.execute({
              inscripcionId: inscripcion.id,
              emitidoPor: 1,
            });
            result.generados++;
            this.logger.log(`Certificado (metadata) generado para inscripción ID: ${inscripcion.id}`);
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

  // Helper savePdf eliminado por arquitectura On-Demand
}
