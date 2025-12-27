import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { IIntentosRepository } from '@/domain/intentos/ports/intentos.repository.port';
import { EvaluationScoringService } from '@/infrastructure/shared/services/evaluation-scoring.service';
import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';

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

    return intentoFinalizado;
  }
}

