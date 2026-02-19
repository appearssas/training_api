import { Injectable } from '@nestjs/common';
import { Pregunta } from '@/entities/evaluaciones/pregunta.entity';
import { OpcionRespuesta } from '@/entities/evaluaciones/opcion-respuesta.entity';
import { RespuestaEstudiante } from '@/entities/evaluaciones/respuesta-estudiante.entity';
import { RespuestaMultiple } from '@/entities/evaluaciones/respuesta-multiple.entity';

/**
 * Servicio para calcular puntajes de evaluaciones
 * Implementa la lógica de calificación automática (RF-18)
 * Sigue el principio de Responsabilidad Única (SOLID)
 */
@Injectable()
export class EvaluationScoringService {
  /**
   * Calcula el puntaje obtenido para una pregunta específica
   * @param pregunta Pregunta con sus opciones
   * @param respuestaEstudiante Respuesta del estudiante
   * @returns Puntaje obtenido (0 a pregunta.puntaje)
   */
  calculateQuestionScore(
    pregunta: Pregunta,
    respuestaEstudiante: RespuestaEstudiante,
  ): number {
    const tipoPregunta = pregunta.tipoPregunta?.codigo?.toUpperCase() || '';

    // Pregunta de texto abierto (OPEN_TEXT)
    // Por defecto, si tiene respuesta, se otorga el puntaje completo
    // En el futuro se podría implementar calificación manual o automática con IA
    if (tipoPregunta === 'OPEN_TEXT') {
      if (
        !respuestaEstudiante.textoRespuesta ||
        respuestaEstudiante.textoRespuesta.trim() === ''
      ) {
        return 0;
      }
      // Si tiene respuesta válida, otorgar el puntaje completo
      // NOTA: Esto es un comportamiento por defecto. En producción, las preguntas OPEN_TEXT
      // deberían ser calificadas manualmente o tener un sistema de calificación automática
      return Number(pregunta.puntaje);
    }

    // Pregunta de completar espacios (FILL_BLANKS)
    // Similar a OPEN_TEXT, requiere respuesta de texto
    if (tipoPregunta === 'FILL_BLANKS') {
      if (
        !respuestaEstudiante.textoRespuesta ||
        respuestaEstudiante.textoRespuesta.trim() === ''
      ) {
        return 0;
      }
      // Por ahora, otorgar puntaje completo si hay respuesta
      // En el futuro, se podría implementar validación más estricta
      return Number(pregunta.puntaje);
    }

    // Si la pregunta no tiene opciones y no es OPEN_TEXT ni FILL_BLANKS, retornar 0
    if (!pregunta.opciones || pregunta.opciones.length === 0) {
      console.warn(
        `Pregunta ${pregunta.id} no tiene opciones y no es OPEN_TEXT ni FILL_BLANKS`,
      );
      return 0;
    }

    // Pregunta de única respuesta (SINGLE_CHOICE, TRUE_FALSE, YES_NO, SELECT_IMAGE)
    // CORRECCIÓN: Cambiar IMAGE_SELECTION por SELECT_IMAGE (código correcto en BD)
    if (
      tipoPregunta === 'SINGLE_CHOICE' ||
      tipoPregunta === 'TRUE_FALSE' ||
      tipoPregunta === 'YES_NO' ||
      tipoPregunta === 'SELECT_IMAGE'
    ) {
      if (!respuestaEstudiante.opcionRespuesta) {
        return 0;
      }

      // Si la opción seleccionada es correcta, dar el puntaje completo
      if (respuestaEstudiante.opcionRespuesta.esCorrecta) {
        return Number(pregunta.puntaje);
      }

      // Si tiene puntaje parcial, usar ese
      if (respuestaEstudiante.opcionRespuesta.puntajeParcial > 0) {
        return Number(respuestaEstudiante.opcionRespuesta.puntajeParcial);
      }

      return 0;
    }

    // Pregunta de múltiple respuesta (MULTIPLE_CHOICE, MATCHING)
    if (tipoPregunta === 'MULTIPLE_CHOICE' || tipoPregunta === 'MATCHING') {
      if (
        !respuestaEstudiante.respuestasMultiples ||
        respuestaEstudiante.respuestasMultiples.length === 0
      ) {
        return 0;
      }

      const opcionesCorrectas = pregunta.opciones.filter(op => op.esCorrecta);
      const opcionesSeleccionadas = respuestaEstudiante.respuestasMultiples.map(
        rm => rm.opcionRespuesta,
      );

      // Verificar que todas las correctas estén seleccionadas y ninguna incorrecta
      const todasCorrectasSeleccionadas = opcionesCorrectas.every(correcta =>
        opcionesSeleccionadas.some(sel => sel.id === correcta.id),
      );

      const ningunaIncorrectaSeleccionada = opcionesSeleccionadas.every(sel =>
        opcionesCorrectas.some(correcta => correcta.id === sel.id),
      );

      if (todasCorrectasSeleccionadas && ningunaIncorrectaSeleccionada) {
        // Puntaje completo
        return Number(pregunta.puntaje);
      }

      // Calcular puntaje parcial basado en opciones correctas seleccionadas
      let puntajeParcial = 0;
      opcionesSeleccionadas.forEach(opcion => {
        if (opcion.esCorrecta && opcion.puntajeParcial > 0) {
          puntajeParcial += Number(opcion.puntajeParcial);
        }
      });

      // Si no hay puntaje parcial definido, calcular proporcionalmente
      if (puntajeParcial === 0) {
        const correctasSeleccionadas = opcionesSeleccionadas.filter(sel =>
          opcionesCorrectas.some(correcta => correcta.id === sel.id),
        ).length;
        const totalCorrectas = opcionesCorrectas.length;
        if (totalCorrectas > 0) {
          puntajeParcial =
            (correctasSeleccionadas / totalCorrectas) *
            Number(pregunta.puntaje);
        }
      }

      return puntajeParcial;
    }

    console.warn(
      `Pregunta ${pregunta.id}: Tipo de pregunta no reconocido: ${tipoPregunta}`,
    );
    return 0;
  }

  /**
   * Calcula el puntaje total de un intento de evaluación
   * @param respuestasEstudiante Todas las respuestas del intento
   * @param preguntas Todas las preguntas de la evaluación
   * @returns Puntaje total obtenido
   */
  calculateTotalScore(
    respuestasEstudiante: RespuestaEstudiante[],
    preguntas: Pregunta[],
  ): number {
    let puntajeTotal = 0;

    // CORRECCIÓN: Filtrar solo preguntas activas para el cálculo
    // Esto asegura que solo se evalúen las preguntas que realmente están activas
    const preguntasActivas = preguntas.filter(p => p.activo !== false);

    respuestasEstudiante.forEach(respuesta => {
      // Buscar la pregunta solo entre las activas
      const pregunta = preguntasActivas.find(
        p => p.id === respuesta.pregunta.id,
      );
      if (pregunta) {
        const puntajePregunta = this.calculateQuestionScore(
          pregunta,
          respuesta,
        );
        puntajeTotal += puntajePregunta;
      }
    });

    return Number(puntajeTotal.toFixed(2));
  }

  /**
   * Calcula el porcentaje obtenido
   * @param puntajeObtenido Puntaje obtenido
   * @param puntajeTotal Puntaje total de la evaluación
   * @returns Porcentaje (0-100)
   */
  calculatePercentage(puntajeObtenido: number, puntajeTotal: number): number {
    if (puntajeTotal === 0) return 0;
    return Number(((puntajeObtenido / puntajeTotal) * 100).toFixed(2));
  }

  /**
   * Determina si el estudiante aprobó la evaluación
   * @param porcentaje Porcentaje obtenido
   * @param minimoAprobacion Porcentaje mínimo para aprobar
   * @returns true si aprobó, false en caso contrario
   */
  isPassed(porcentaje: number, minimoAprobacion: number): boolean {
    return porcentaje >= minimoAprobacion;
  }
}
