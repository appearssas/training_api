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
    console.log(`Calculando puntaje para pregunta ${pregunta.id}, tipo: ${tipoPregunta}, codigo: ${pregunta.tipoPregunta?.codigo}`);

    // Pregunta de texto abierto (OPEN_TEXT)
    // Por defecto, si tiene respuesta, se otorga el puntaje completo
    // En el futuro se podría implementar calificación manual o automática con IA
    if (tipoPregunta === 'OPEN_TEXT') {
      if (!respuestaEstudiante.textoRespuesta || respuestaEstudiante.textoRespuesta.trim() === '') {
        console.log(`Pregunta ${pregunta.id} (OPEN_TEXT): Sin respuesta o respuesta vacía`);
        return 0;
      }
      // Si tiene respuesta válida, otorgar el puntaje completo
      // NOTA: Esto es un comportamiento por defecto. En producción, las preguntas OPEN_TEXT
      // deberían ser calificadas manualmente o tener un sistema de calificación automática
      console.log(`Pregunta ${pregunta.id} (OPEN_TEXT): Respuesta encontrada, otorgando puntaje completo`);
      return Number(pregunta.puntaje);
    }

    // Pregunta de completar espacios (FILL_BLANKS)
    // Similar a OPEN_TEXT, requiere respuesta de texto
    if (tipoPregunta === 'FILL_BLANKS') {
      if (!respuestaEstudiante.textoRespuesta || respuestaEstudiante.textoRespuesta.trim() === '') {
        console.log(`Pregunta ${pregunta.id} (FILL_BLANKS): Sin respuesta o respuesta vacía`);
        return 0;
      }
      // Por ahora, otorgar puntaje completo si hay respuesta
      // En el futuro, se podría implementar validación más estricta
      console.log(`Pregunta ${pregunta.id} (FILL_BLANKS): Respuesta encontrada, otorgando puntaje completo`);
      return Number(pregunta.puntaje);
    }

    // Si la pregunta no tiene opciones y no es OPEN_TEXT ni FILL_BLANKS, retornar 0
    if (!pregunta.opciones || pregunta.opciones.length === 0) {
      console.warn(`Pregunta ${pregunta.id} no tiene opciones y no es OPEN_TEXT ni FILL_BLANKS`);
      return 0;
    }

    // Pregunta de única respuesta (SINGLE_CHOICE, TRUE_FALSE, YES_NO, SELECT_IMAGE)
    // CORRECCIÓN: Cambiar IMAGE_SELECTION por SELECT_IMAGE (código correcto en BD)
    if (tipoPregunta === 'SINGLE_CHOICE' || tipoPregunta === 'TRUE_FALSE' || tipoPregunta === 'YES_NO' || tipoPregunta === 'SELECT_IMAGE') {
      if (!respuestaEstudiante.opcionRespuesta) {
        console.log(`Pregunta ${pregunta.id} (${tipoPregunta}): Sin opción seleccionada`);
        return 0;
      }

      // Si la opción seleccionada es correcta, dar el puntaje completo
      if (respuestaEstudiante.opcionRespuesta.esCorrecta) {
        console.log(`Pregunta ${pregunta.id} (${tipoPregunta}): Opción correcta seleccionada`);
        return Number(pregunta.puntaje);
      }

      // Si tiene puntaje parcial, usar ese
      if (respuestaEstudiante.opcionRespuesta.puntajeParcial > 0) {
        console.log(`Pregunta ${pregunta.id} (${tipoPregunta}): Usando puntaje parcial`);
        return Number(respuestaEstudiante.opcionRespuesta.puntajeParcial);
      }

      console.log(`Pregunta ${pregunta.id} (${tipoPregunta}): Opción incorrecta seleccionada`);
      return 0;
    }

    // Pregunta de múltiple respuesta (MULTIPLE_CHOICE, MATCHING)
    if (tipoPregunta === 'MULTIPLE_CHOICE' || tipoPregunta === 'MATCHING') {
      if (!respuestaEstudiante.respuestasMultiples || respuestaEstudiante.respuestasMultiples.length === 0) {
        console.log(`Pregunta ${pregunta.id} (${tipoPregunta}): Sin respuestas múltiples`);
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
        console.log(`Pregunta ${pregunta.id} (${tipoPregunta}): Todas las opciones correctas seleccionadas`);
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

      console.log(`Pregunta ${pregunta.id} (${tipoPregunta}): Puntaje parcial calculado: ${puntajeParcial}`);
      return puntajeParcial;
    }

    console.warn(`Pregunta ${pregunta.id}: Tipo de pregunta no reconocido: ${tipoPregunta}`);
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
    console.log('Total preguntas recibidas:', preguntas.length);
    
    // CORRECCIÓN: Filtrar solo preguntas activas para el cálculo
    // Esto asegura que solo se evalúen las preguntas que realmente están activas
    const preguntasActivas = preguntas.filter((p) => p.activo !== false);
    console.log('Preguntas activas:', preguntasActivas.length);
    console.log('Total respuestas:', respuestasEstudiante.length);

    respuestasEstudiante.forEach((respuesta, index) => {
      // Buscar la pregunta solo entre las activas
      const pregunta = preguntasActivas.find((p) => p.id === respuesta.pregunta.id);
      if (pregunta) {
        const puntajePregunta = this.calculateQuestionScore(pregunta, respuesta);
        console.log(`Respuesta ${index + 1}: Pregunta ID ${pregunta.id}, Puntaje obtenido: ${puntajePregunta}, Puntaje max: ${pregunta.puntaje}`);
        puntajeTotal += puntajePregunta;
      } else {
        console.warn(`No se encontró la pregunta activa con ID ${respuesta.pregunta.id} para la respuesta ${index + 1}`);
      }
    });

    // Verificar si hay preguntas activas sin respuesta
    const preguntasActivasSinRespuesta = preguntasActivas.filter(
      (pregunta) => !respuestasEstudiante.some((resp) => resp.pregunta.id === pregunta.id),
    );
    
    if (preguntasActivasSinRespuesta.length > 0) {
      console.warn('⚠️ Preguntas activas sin respuesta:', 
        preguntasActivasSinRespuesta.map((p) => ({ 
          id: p.id, 
          enunciado: p.enunciado.substring(0, 50) + '...', 
          puntaje: p.puntaje,
          requerida: p.requerida,
        }))
      );
    }

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

