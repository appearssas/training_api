import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';

/**
 * Servicio para validar evaluaciones según RF-09
 * Valida que cada capacitación tenga obligatoriamente una evaluación vinculada
 */
@Injectable()
export class EvaluacionValidatorService {
  constructor(
    @InjectRepository(Evaluacion)
    private readonly evaluacionRepository: Repository<Evaluacion>,
    @InjectRepository(Capacitacion)
    private readonly capacitacionRepository: Repository<Capacitacion>,
  ) {}

  /**
   * Valida que una capacitación tenga al menos una evaluación activa
   * @param capacitacionId ID de la capacitación
   * @throws BadRequestException si no tiene evaluación
   */
  async validateCapacitacionHasEvaluation(
    capacitacionId: number,
  ): Promise<void> {
    const evaluaciones = await this.evaluacionRepository.find({
      where: {
        capacitacion: { id: capacitacionId },
        activo: true,
      },
    });

    if (!evaluaciones || evaluaciones.length === 0) {
      throw new BadRequestException(
        'Cada capacitación debe tener obligatoriamente una evaluación vinculada. No se puede publicar un curso sin evaluación (RF-09).',
      );
    }
  }

  /**
   * Valida que una evaluación exista y esté activa
   * @param evaluacionId ID de la evaluación
   * @throws BadRequestException si no existe o no está activa
   */
  async validateEvaluationExists(evaluacionId: number): Promise<Evaluacion> {
    const evaluacion = await this.evaluacionRepository.findOne({
      where: { id: evaluacionId, activo: true },
      relations: ['capacitacion'],
    });

    if (!evaluacion) {
      throw new BadRequestException(
        `Evaluación con ID ${evaluacionId} no encontrada o no está activa`,
      );
    }

    return evaluacion;
  }

  /**
   * Valida que una evaluación no esté ya vinculada a otra capacitación
   * @param evaluacionId ID de la evaluación
   * @param capacitacionId ID de la capacitación (opcional, para validar si ya está vinculada)
   * @throws BadRequestException si ya está vinculada a otra capacitación
   */
  async validateEvaluationNotLinked(
    evaluacionId: number,
    capacitacionId?: number,
  ): Promise<void> {
    const evaluacion = await this.validateEvaluationExists(evaluacionId);

    // Si la evaluación ya tiene una capacitación y es diferente a la actual
    if (
      evaluacion.capacitacion &&
      evaluacion.capacitacion.id !== capacitacionId
    ) {
      throw new BadRequestException(
        `La evaluación con ID ${evaluacionId} ya está vinculada a otra capacitación (ID: ${evaluacion.capacitacion.id})`,
      );
    }
  }

  /**
   * Valida que una capacitación pueda ser publicada (tiene evaluación)
   * @param capacitacionId ID de la capacitación
   * @param nuevoEstado Nuevo estado que se intenta asignar
   * @throws BadRequestException si intenta publicar sin evaluación
   */
  async validateCanPublish(
    capacitacionId: number,
    nuevoEstado: EstadoCapacitacion,
  ): Promise<void> {
    // Solo validar si el nuevo estado es PUBLICADA
    if (nuevoEstado === EstadoCapacitacion.PUBLICADA) {
      await this.validateCapacitacionHasEvaluation(capacitacionId);
    }
  }

  /**
   * Obtiene todas las evaluaciones de una capacitación
   * @param capacitacionId ID de la capacitación
   * @returns Lista de evaluaciones
   */
  async getEvaluacionesByCapacitacion(
    capacitacionId: number,
  ): Promise<Evaluacion[]> {
    return this.evaluacionRepository.find({
      where: {
        capacitacion: { id: capacitacionId },
      },
      relations: ['preguntas'],
      order: { orden: 'ASC', fechaCreacion: 'ASC' },
    });
  }
}
