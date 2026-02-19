import { Injectable, Inject } from '@nestjs/common';
import { IIntentosRepository } from '@/domain/intentos/ports/intentos.repository.port';
import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';

/**
 * Caso de uso para obtener los intentos de un estudiante
 * Sigue el principio de Responsabilidad Única (SOLID)
 */
@Injectable()
export class GetAttemptsUseCase {
  constructor(
    @Inject('IIntentosRepository')
    private readonly intentosRepository: IIntentosRepository,
  ) {}

  async execute(
    evaluacionId: number,
    inscripcionId: number,
  ): Promise<IntentoEvaluacion[]> {
    return this.intentosRepository.getAttemptsByStudent(
      evaluacionId,
      inscripcionId,
    );
  }
}
