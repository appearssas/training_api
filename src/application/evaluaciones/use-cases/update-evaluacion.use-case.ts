import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IEvaluacionesRepository } from '@/domain/evaluaciones/ports/evaluaciones.repository.port';
import { UpdateEvaluacionDto } from '@/application/evaluaciones/dto';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';

/**
 * Caso de uso para actualizar una evaluación
 * Sigue el principio de Responsabilidad Única (SOLID)
 * Maneja la actualización de la evaluación y sus preguntas/opciones
 */
@Injectable()
export class UpdateEvaluacionUseCase {
  constructor(
    @Inject('IEvaluacionesRepository')
    private readonly evaluacionesRepository: IEvaluacionesRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para actualizar una evaluación
   * @param id - ID de la evaluación a actualizar
   * @param updateEvaluacionDto - Datos para actualizar la evaluación
   * @returns La evaluación actualizada
   * @throws NotFoundException si la evaluación no existe
   * @throws BadRequestException si los datos son inválidos
   */
  async execute(
    id: number,
    updateEvaluacionDto: UpdateEvaluacionDto,
  ): Promise<Evaluacion> {
    // Verificar que la evaluación existe
    const existingEvaluacion = await this.evaluacionesRepository.findOne(id);
    if (!existingEvaluacion) {
      throw new NotFoundException(`Evaluación con ID ${id} no encontrada`);
    }

    // Validar que si se actualizan preguntas, haya al menos una
    if (updateEvaluacionDto.preguntas !== undefined) {
      if (updateEvaluacionDto.preguntas.length === 0) {
        throw new BadRequestException(
          'La evaluación debe tener al menos una pregunta',
        );
      }

      // Validar que cada pregunta tenga al menos una opción
      for (const pregunta of updateEvaluacionDto.preguntas) {
        if (!pregunta.opciones || pregunta.opciones.length === 0) {
          throw new BadRequestException(
            'Cada pregunta debe tener al menos una opción de respuesta',
          );
        }
      }
    }

    return this.evaluacionesRepository.update(id, updateEvaluacionDto);
  }
}
