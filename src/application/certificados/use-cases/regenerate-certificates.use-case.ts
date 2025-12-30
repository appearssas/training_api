import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateCertificadoUseCase } from './create-certificado.use-case';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { EstadoInscripcion } from '@/entities/inscripcion/types';

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
}
