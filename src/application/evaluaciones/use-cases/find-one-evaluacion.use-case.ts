import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEvaluacionesRepository } from '@/domain/evaluaciones/ports/evaluaciones.repository.port';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';

/**
 * Caso de uso para obtener una evaluación por ID
 * Sigue el principio de Responsabilidad Única (SOLID)
 */
@Injectable()
export class FindOneEvaluacionUseCase {
  constructor(
    @Inject('IEvaluacionesRepository')
    private readonly evaluacionesRepository: IEvaluacionesRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para obtener una evaluación
   * @param id - ID de la evaluación a obtener
   * @returns La evaluación encontrada con sus preguntas y opciones
   * @throws NotFoundException si la evaluación no existe
   */
  async execute(id: number): Promise<Evaluacion> {
    const evaluacion = await this.evaluacionesRepository.findOne(id);

    if (!evaluacion) {
      throw new NotFoundException(`Evaluación con ID ${id} no encontrada`);
    }

    return evaluacion;
  }
}
