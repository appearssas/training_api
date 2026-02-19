import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { CreateEvaluacionDto } from '@/application/evaluaciones/dto/create-evaluacion.dto';
import { UpdateEvaluacionDto } from '@/application/evaluaciones/dto/update-evaluacion.dto';

/**
 * Puerto para el repositorio de Evaluaciones
 * Define el contrato que debe cumplir cualquier implementación
 * Sigue el principio de Inversión de Dependencias (SOLID)
 */
export interface IEvaluacionesRepository {
  /**
   * Obtener una evaluación por ID con sus preguntas y opciones
   */
  findOne(id: number): Promise<Evaluacion | null>;

  /**
   * Actualizar una evaluación existente
   * Incluye la actualización de preguntas y opciones
   */
  update(
    id: number,
    updateEvaluacionDto: UpdateEvaluacionDto,
  ): Promise<Evaluacion>;
}
