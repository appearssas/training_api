import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';
import { StartIntentoDto } from '@/application/intentos/dto/start-intento.dto';
import { SubmitAnswerDto } from '@/application/intentos/dto/submit-answer.dto';

/**
 * Puerto (interface) para el repositorio de intentos de evaluación
 * Define el contrato que debe cumplir cualquier implementación
 * Sigue el principio de Inversión de Dependencias (SOLID)
 */
export interface IIntentosRepository {
  /**
   * Iniciar un nuevo intento de evaluación
   * Valida que el estudiante tenga intentos disponibles
   * @param evaluacionId ID de la evaluación
   * @param dto Datos para iniciar el intento
   * @returns Intento de evaluación creado
   */
  startAttempt(
    evaluacionId: number,
    dto: StartIntentoDto,
  ): Promise<IntentoEvaluacion>;

  /**
   * Guardar o actualizar una respuesta del estudiante
   * @param intentoId ID del intento de evaluación
   * @param dto Datos de la respuesta
   * @returns Respuesta guardada
   */
  saveAnswer(intentoId: number, dto: SubmitAnswerDto): Promise<void>;

  /**
   * Finalizar un intento de evaluación
   * Calcula el puntaje automáticamente y actualiza el estado
   * @param intentoId ID del intento de evaluación
   * @returns Intento finalizado con puntaje calculado
   */
  finishAttempt(intentoId: number): Promise<IntentoEvaluacion>;

  /**
   * Obtener todos los intentos de un estudiante para una evaluación
   * @param evaluacionId ID de la evaluación
   * @param inscripcionId ID de la inscripción del estudiante
   * @returns Lista de intentos
   */
  getAttemptsByStudent(
    evaluacionId: number,
    inscripcionId: number,
  ): Promise<IntentoEvaluacion[]>;

  /**
   * Obtener un intento específico por ID
   * @param intentoId ID del intento
   * @returns Intento de evaluación
   */
  getAttemptById(intentoId: number): Promise<IntentoEvaluacion | null>;

  /**
   * Verificar si un estudiante tiene intentos disponibles
   * @param evaluacionId ID de la evaluación
   * @param inscripcionId ID de la inscripción del estudiante
   * @returns true si tiene intentos disponibles, false en caso contrario
   */
  hasAttemptsAvailable(
    evaluacionId: number,
    inscripcionId: number,
  ): Promise<boolean>;

  /**
   * Obtener el número de intento siguiente para un estudiante
   * @param evaluacionId ID de la evaluación
   * @param inscripcionId ID de la inscripción del estudiante
   * @returns Número del siguiente intento
   */
  getNextAttemptNumber(
    evaluacionId: number,
    inscripcionId: number,
  ): Promise<number>;
}
