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
    // Si la pregunta no tiene opciones (respuesta abierta), retornar 0 por ahora
    // En el futuro se podría implementar calificación manual
    if (!pregunta.opciones || pregunta.opciones.length === 0) {
      console.warn(`Pregunta ${pregunta.id} no tiene opciones`);
      return 0;
    }

    const tipoPregunta = pregunta.tipoPregunta?.codigo?.toUpperCase() || '';
    console.log(`Calculando puntaje para pregunta ${pregunta.id}, tipo: ${tipoPregunta}, codigo: ${pregunta.tipoPregunta?.codigo}`);

    // Pregunta de única respuesta (SINGLE_CHOICE, TRUE_FALSE)
    if (tipoPregunta === 'SINGLE_CHOICE' || tipoPregunta === 'TRUE_FALSE') {
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
      if (!respuestaEstudiante.respuestasMultiples || respuestaEstudiante.respuestasMultiples.length === 0) {
        return 0;
      }

      const opcionesCorrectas = pregunta.opciones.filter((op) => op.esCorrecta);
      const opcionesSeleccionadas = respuestaEstudiante.respuestasMultiples.map(
        (rm) => rm.opcionRespuesta,
      );

      // Verificar que todas las correctas estén seleccionadas y ninguna incorrecta
      const todasCorrectasSeleccionadas = opcionesCorrectas.every((correcta) =>
        opcionesSeleccionadas.some((sel) => sel.id === correcta.id),
      );

      const ningunaIncorrectaSeleccionada = opcionesSeleccionadas.every((sel) =>
        opcionesCorrectas.some((correcta) => correcta.id === sel.id),
      );

      if (todasCorrectasSeleccionadas && ningunaIncorrectaSeleccionada) {
        // Puntaje completo
        return Number(pregunta.puntaje);
      }

      // Calcular puntaje parcial basado en opciones correctas seleccionadas
      let puntajeParcial = 0;
      opcionesSeleccionadas.forEach((opcion) => {
        if (opcion.esCorrecta && opcion.puntajeParcial > 0) {
          puntajeParcial += Number(opcion.puntajeParcial);
        }
      });

      // Si no hay puntaje parcial definido, calcular proporcionalmente
      if (puntajeParcial === 0) {
        const correctasSeleccionadas = opcionesSeleccionadas.filter((sel) =>
          opcionesCorrectas.some((correcta) => correcta.id === sel.id),
        ).length;
        const totalCorrectas = opcionesCorrectas.length;
        if (totalCorrectas > 0) {
          puntajeParcial = (correctasSeleccionadas / totalCorrectas) * Number(pregunta.puntaje);
        }
      }

      return puntajeParcial;
    }

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

    console.log('=== DEBUG calculateTotalScore ===');
    console.log('Total preguntas:', preguntas.length);
    console.log('Total respuestas:', respuestasEstudiante.length);

    respuestasEstudiante.forEach((respuesta, index) => {
      const pregunta = preguntas.find((p) => p.id === respuesta.pregunta.id);
      if (pregunta) {
        const puntajePregunta = this.calculateQuestionScore(pregunta, respuesta);
        console.log(`Respuesta ${index + 1}: Pregunta ID ${pregunta.id}, Puntaje obtenido: ${puntajePregunta}, Puntaje max: ${pregunta.puntaje}`);
        puntajeTotal += puntajePregunta;
      } else {
        console.warn(`No se encontró la pregunta con ID ${respuesta.pregunta.id} para la respuesta ${index + 1}`);
      }
    });

    console.log('Puntaje total calculado:', puntajeTotal);
    console.log('=== FIN DEBUG calculateTotalScore ===');

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

