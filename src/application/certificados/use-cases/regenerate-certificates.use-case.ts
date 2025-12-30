import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateCertificadoUseCase } from './create-certificado.use-case';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { EstadoInscripcion } from '@/entities/inscripcion/types';
import { PdfGeneratorService } from '@/infrastructure/shared/services/pdf-generator.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

interface RegenerationResult {
  totalAprobados: number;
  yaTenianCertificado: number;
  generados: number;
  errores: number;
  detallesErrores: string[];
}

/**
 * Caso de uso para regenerar certificados faltantes
 * Busca inscripciones aprobadas sin certificado y los genera
 */
@Injectable()
export class RegenerateCertificatesUseCase {
  private readonly logger = new Logger(RegenerateCertificatesUseCase.name);

  constructor(
    private readonly createCertificadoUseCase: CreateCertificadoUseCase,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly configService: ConfigService,
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: any, // Using 'any' or interface if importable, simpler to use any for quick fix or repo type

  ) {}

  async execute(): Promise<RegenerationResult> {
    this.logger.log('Iniciando regeneración masiva de certificados');
    
    // 1. Buscar todas las inscripciones aprobadas
    // Estado debe ser CERTIFICADO o COMPLETADO, y aprobado = true
    const inscripcionesAprobadas = await this.inscripcionRepository.find({
      where: [
        { estado: EstadoInscripcion.COMPLETADO, aprobado: true },
        // También incluimos las que están en progreso pero marcadas como aprobadas por seguridad
        { estado: EstadoInscripcion.EN_PROGRESO, aprobado: true }
      ],
      relations: ['certificados', 'capacitacion', 'capacitacion.tipoCapacitacion'],
    });

    const result: RegenerationResult = {
      totalAprobados: inscripcionesAprobadas.length,
      yaTenianCertificado: 0,
      generados: 0,
      errores: 0,
      detallesErrores: [],
    };

    for (const inscripcion of inscripcionesAprobadas) {
      // Filtrar solo las que califiquen para certificado (Tipo CERTIFIED)
      const tipoCapacitacion = inscripcion.capacitacion?.tipoCapacitacion?.codigo?.toUpperCase();
      if (tipoCapacitacion !== 'CERTIFIED') {
        continue;
      }

      // Verificar si ya tiene certificado
      if (inscripcion.certificados && inscripcion.certificados.length > 0) {
        // FORCE REGENERATE PDF for existing certificate
        try {
            const cert = inscripcion.certificados[0];
            // Asegurar que la inscripción está asignada para el generador
            cert.inscripcion = inscripcion;
            const pdfBuffer = await this.pdfGenerator.generateCertificate(cert);
            const newPath = await this.savePdf(cert.id, pdfBuffer);
            
            // UPDATE DB URL
            cert.urlCertificado = newPath;
            await this.certificadosRepository.save(cert);

            this.logger.log(`PDF Regenerado y URL actualizada para certificado ID: ${cert.id}`);
            result.generados++; // Count as generated/updated
        } catch (error) {
            this.logger.error(`Error regenerando PDF para inscripción ${inscripcion.id}`, error);
            result.errores++;
        }
        result.yaTenianCertificado++;
        continue;
      }

      // Generar certificado
      try {
        await this.createCertificadoUseCase.execute({
          inscripcionId: inscripcion.id,
          emitidoPor: 1, // System admin
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

    this.logger.log('Regeneración finalizada', result);
    return result;
  }

  /* Helper para guardar PDF */
  private async savePdf(certificadoId: number | string, pdfBuffer: Buffer): Promise<string> {
    const storagePath = this.configService.get<string>('PDF_STORAGE_PATH') || './storage/certificates';
    await fs.mkdir(storagePath, { recursive: true });
    
    // FORCE NEW FILE to avoid cache issues
    const fileName = `certificado-${certificadoId}-${Date.now()}.pdf`;
    const filePath = path.join(storagePath, fileName);
    
    // Remove old files for this certificate to keep storage clean? Optional. 
    // For now, just write new.
    await fs.writeFile(filePath, pdfBuffer);
    
    // Return relative path or filename as stored in DB.
    // Usually DB stores 'storage/certificates/file.pdf' or just 'certificates/file.pdf'?
    // Let's assume it stores relative path from project root? 
    // CreateCertificadoUseCase uses: `return filePath;` which is likely relative `storage/certificates/...` 
    // based on default `storagePath`.
    // Wait, `storagePath` defaults to `./storage/certificates`.
    // So `filePath` is `storage/certificates/filename.pdf`.
    return filePath;
  }
}
