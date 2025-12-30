import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { IIntentosRepository } from '@/domain/intentos/ports/intentos.repository.port';
import { EvaluationScoringService } from '@/infrastructure/shared/services/evaluation-scoring.service';
import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';
import { CreateCertificadoUseCase } from '@/application/certificados/use-cases/create-certificado.use-case';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';

/**
 * Caso de uso para finalizar un intento de evaluación
 * Calcula el puntaje automáticamente (RF-18)
 * Actualiza el estado del intento y determina si aprobó
 * Sigue el principio de Responsabilidad Única (SOLID)
 */
@Injectable()
export class FinishIntentoUseCase {
  constructor(
    @Inject('IIntentosRepository')
    private readonly intentosRepository: IIntentosRepository,
    private readonly scoringService: EvaluationScoringService,
    private readonly createCertificadoUseCase: CreateCertificadoUseCase,
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
  ) {}

  async execute(intentoId: number): Promise<IntentoEvaluacion> {
    // Validar que el intento existe
    const intento = await this.intentosRepository.getAttemptById(intentoId);
    if (!intento) {
      throw new NotFoundException(`Intento con ID ${intentoId} no encontrado`);
    }

    if (intento.estado !== 'en_progreso') {
      throw new BadRequestException(
        `No se puede finalizar un intento que está ${intento.estado}`,
      );
    }

    // Finalizar el intento (calcula puntaje automáticamente)
    const intentoFinalizado = await this.intentosRepository.finishAttempt(intentoId);
    
    // GENERACIÓN AUTOMÁTICA DE CERTIFICADO (RF-22)
    // Si aprobó, generar certificado automáticamente
    if (intentoFinalizado.aprobado) {
      try {
        console.log(`🎓 Intento ${intentoId} aprobado. Verificando generación de certificado...`);
        
        // Obtener inscripción ID (asumiendo que intento tiene la relación cargada o se puede obtener)
        // Nota: getAttemptById debería traer la relación inscripcion
        const inscripcionId = intento.inscripcion?.id;
        
        if (inscripcionId) {
          // Verificar si ya existe certificado para evitar duplicados
          const certificadosExistentes = await this.certificadosRepository.findByInscripcion(inscripcionId);
          
          if (certificadosExistentes.length === 0) {
            console.log(`✨ Generando certificado automático para inscripción ${inscripcionId}`);
            await this.createCertificadoUseCase.execute({
              inscripcionId,
              emitidoPor: 1, // System automated
            });
          } else {
            console.log(`ℹ️ La inscripción ${inscripcionId} ya tiene certificado. Omitiendo generación.`);
          }
        } else {
          console.warn(`⚠️ No se pudo obtener inscripcionId del intento ${intentoId} para generar certificado.`);
        }
      } catch (error) {
        // No bloquear la finalización del intento si falla la generación del certificado
        console.error('❌ Error generando certificado automático:', error);
        // Opcional: Notificar a administradores o guardar en cola de reintentos
      }
    }

    return intentoFinalizado;
  }
}

