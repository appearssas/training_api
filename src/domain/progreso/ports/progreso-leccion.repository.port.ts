/**
 * Puerto para marcar progreso de lecciones de una inscripción.
 * Usado por el caso de uso "Completar capacitaciones de usuario" (admin).
 */
export interface IProgresoLeccionRepository {
  /**
   * Marca todas las lecciones indicadas como completadas para la inscripción.
   * Crea registros de ProgresoLeccion si no existen o actualiza completada/fechaCompletada.
   */
  markAllAsCompleted(
    inscripcionId: number,
    leccionIds: number[],
  ): Promise<void>;
}
