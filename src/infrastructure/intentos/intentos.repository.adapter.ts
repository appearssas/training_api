import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { IIntentosRepository } from '@/domain/intentos/ports/intentos.repository.port';
import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';
import { RespuestaEstudiante } from '@/entities/evaluaciones/respuesta-estudiante.entity';
import { RespuestaMultiple } from '@/entities/evaluaciones/respuesta-multiple.entity';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { Pregunta } from '@/entities/evaluaciones/pregunta.entity';
import { OpcionRespuesta } from '@/entities/evaluaciones/opcion-respuesta.entity';
import { StartIntentoDto } from '@/application/intentos/dto/start-intento.dto';
import { SubmitAnswerDto } from '@/application/intentos/dto/submit-answer.dto';
import { EstadoIntento } from '@/entities/evaluaciones/types';
import { EvaluationScoringService } from '@/infrastructure/shared/services/evaluation-scoring.service';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { TipoCapacitacion } from '@/entities/catalogos/tipo-capacitacion.entity';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { CreateCertificadoUseCase } from '@/application/certificados/use-cases/create-certificado.use-case';

/**
 * Adaptador del repositorio de Intentos de Evaluación
 * Implementa IIntentosRepository usando TypeORM
 * Sigue el principio de Inversión de Dependencias (SOLID)
 */
@Injectable()
export class IntentosRepositoryAdapter implements IIntentosRepository {
  constructor(
    @InjectRepository(IntentoEvaluacion)
    private readonly intentoRepository: Repository<IntentoEvaluacion>,
    @InjectRepository(RespuestaEstudiante)
    private readonly respuestaRepository: Repository<RespuestaEstudiante>,
    @InjectRepository(RespuestaMultiple)
    private readonly respuestaMultipleRepository: Repository<RespuestaMultiple>,
    @InjectRepository(Evaluacion)
    private readonly evaluacionRepository: Repository<Evaluacion>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    @InjectRepository(Pregunta)
    private readonly preguntaRepository: Repository<Pregunta>,
    @InjectRepository(OpcionRespuesta)
    private readonly opcionRepository: Repository<OpcionRespuesta>,
    @InjectRepository(Capacitacion)
    private readonly capacitacionRepository: Repository<Capacitacion>,
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
    private readonly dataSource: DataSource,
    private readonly scoringService: EvaluationScoringService,
    private readonly createCertificadoUseCase: CreateCertificadoUseCase,
  ) {}

  async startAttempt(evaluacionId: number, dto: StartIntentoDto): Promise<IntentoEvaluacion> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtener evaluación e inscripción
      const evaluacion = await queryRunner.manager.findOne(Evaluacion, {
        where: { id: evaluacionId },
      });
      if (!evaluacion) {
        throw new NotFoundException(`Evaluación con ID ${evaluacionId} no encontrada`);
      }

      const inscripcion = await queryRunner.manager.findOne(Inscripcion, {
        where: { id: dto.inscripcionId },
      });
      if (!inscripcion) {
        throw new NotFoundException(`Inscripción con ID ${dto.inscripcionId} no encontrada`);
      }

      // Obtener número de intento
      const numeroIntento = await this.getNextAttemptNumber(evaluacionId, dto.inscripcionId);

      // Crear intento
      const nuevoIntento = queryRunner.manager.create(IntentoEvaluacion, {
        evaluacion: { id: evaluacionId } as Evaluacion,
        inscripcion: { id: dto.inscripcionId } as Inscripcion,
        numeroIntento,
        estado: EstadoIntento.EN_PROGRESO,
        puntajeObtenido: 0,
        puntajeTotal: evaluacion.puntajeTotal,
      });

      const intentoGuardado = await queryRunner.manager.save(nuevoIntento);

      await queryRunner.commitTransaction();
      return intentoGuardado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async saveAnswer(intentoId: number, dto: SubmitAnswerDto): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el intento existe y está en progreso
      const intento = await queryRunner.manager.findOne(IntentoEvaluacion, {
        where: { id: intentoId },
      });
      if (!intento) {
        throw new NotFoundException(`Intento con ID ${intentoId} no encontrado`);
      }

      if (intento.estado !== EstadoIntento.EN_PROGRESO) {
        throw new InternalServerErrorException(
          `No se puede guardar respuestas en un intento ${intento.estado}`,
        );
      }

      // Buscar respuesta existente para esta pregunta
      let respuestaExistente = await queryRunner.manager.findOne(RespuestaEstudiante, {
        where: {
          intentoEvaluacion: { id: intentoId },
          pregunta: { id: dto.preguntaId },
        },
        relations: ['respuestasMultiples'],
      });

      if (respuestaExistente) {
        // Eliminar respuestas múltiples existentes
        if (respuestaExistente.respuestasMultiples && respuestaExistente.respuestasMultiples.length > 0) {
          await queryRunner.manager.remove(respuestaExistente.respuestasMultiples);
        }
      } else {
        // Crear nueva respuesta
        respuestaExistente = queryRunner.manager.create(RespuestaEstudiante, {
          intentoEvaluacion: { id: intentoId } as IntentoEvaluacion,
          pregunta: { id: dto.preguntaId } as Pregunta,
        });
      }

      // Actualizar respuesta según el tipo
      if (dto.opcionRespuestaId) {
        // Respuesta única
        respuestaExistente.opcionRespuesta = { id: dto.opcionRespuestaId } as OpcionRespuesta;
        respuestaExistente.textoRespuesta = undefined as any;
      } else if (dto.opcionRespuestaIds && dto.opcionRespuestaIds.length > 0) {
        // Respuesta múltiple
        respuestaExistente.opcionRespuesta = undefined as any;
        respuestaExistente.textoRespuesta = undefined as any;
      } else if (dto.textoRespuesta) {
        // Respuesta abierta
        respuestaExistente.opcionRespuesta = undefined as any;
        respuestaExistente.textoRespuesta = dto.textoRespuesta;
      }

      const respuestaGuardada = await queryRunner.manager.save(respuestaExistente);

      // Guardar respuestas múltiples si aplica
      if (dto.opcionRespuestaIds && dto.opcionRespuestaIds.length > 0) {
        const respuestasMultiples = dto.opcionRespuestaIds.map((opcionId) =>
          queryRunner.manager.create(RespuestaMultiple, {
            respuestaEstudiante: respuestaGuardada,
            opcionRespuesta: { id: opcionId } as OpcionRespuesta,
          }),
        );
        await queryRunner.manager.save(respuestasMultiples);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async finishAttempt(intentoId: number): Promise<IntentoEvaluacion> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtener intento con todas las relaciones necesarias
      const intento = await queryRunner.manager.findOne(IntentoEvaluacion, {
        where: { id: intentoId },
        relations: [
          'evaluacion',
          'evaluacion.preguntas',
          'evaluacion.preguntas.opciones',
          'evaluacion.preguntas.tipoPregunta',
          'inscripcion',
          'inscripcion.estudiante',
          'inscripcion.capacitacion',
          'inscripcion.capacitacion.tipoCapacitacion',
        ],
      });

      if (!intento) {
        throw new NotFoundException(`Intento con ID ${intentoId} no encontrado`);
      }

      // TAREA 1.2: Validar tipo de capacitación antes de calificar (FAL-003)
      // Obtener tipo de capacitación desde la inscripción
      const tipoCapacitacionCodigo = intento.inscripcion?.capacitacion?.tipoCapacitacion?.codigo?.toUpperCase();
      const esEncuesta = tipoCapacitacionCodigo === 'SURVEY';

      console.log('=== VALIDACIÓN DE TIPO DE CAPACITACIÓN ===');
      console.log('Tipo de capacitación:', tipoCapacitacionCodigo);
      console.log('Es encuesta (SURVEY):', esEncuesta);

      // Obtener todas las respuestas del intento
      const respuestas = await queryRunner.manager.find(RespuestaEstudiante, {
        where: { intentoEvaluacion: { id: intentoId } },
        relations: [
          'pregunta',
          'pregunta.opciones',
          'pregunta.tipoPregunta',
          'opcionRespuesta',
          'respuestasMultiples',
          'respuestasMultiples.opcionRespuesta',
        ],
      });

      // TAREA 1.1: Si es encuesta (SURVEY), NO calcular puntajes (FAL-001)
      let puntajeObtenido = 0;
      let porcentaje: number | null = null;
      let aprobado: boolean | null = null;

      if (esEncuesta) {
        console.log('⚠ Encuesta detectada: NO se calcularán puntajes ni se determinará aprobación');
        // Para encuestas, no calcular puntajes
        // Los valores se mantendrán como null
      } else {
        // Calcular puntaje total solo si NO es encuesta
        puntajeObtenido = this.scoringService.calculateTotalScore(
          respuestas,
          intento.evaluacion.preguntas,
        );
      }

      // Solo calcular puntajes y porcentajes si NO es encuesta
      if (!esEncuesta) {
        // CORRECCIÓN CRÍTICA: Filtrar solo preguntas activas al calcular el puntaje total
        // Esto asegura que el cálculo sea consistente con las preguntas que realmente se evalúan
        // Si hay preguntas inactivas, no deben contar en el total para el cálculo del porcentaje
        const preguntasActivas = intento.evaluacion.preguntas.filter(
          (p) => p.activo !== false, // Incluir preguntas activas (activo = true o null/undefined)
        );

        console.log('=== DEBUG: Preguntas activas vs totales ===');
        console.log('Total preguntas en evaluación:', intento.evaluacion.preguntas.length);
        console.log('Preguntas activas:', preguntasActivas.length);
        console.log('Total respuestas recibidas:', respuestas.length);

        // Calcular el puntaje total real sumando solo las preguntas activas
        // Esto asegura consistencia incluso si el puntajeTotal de la evaluación no está actualizado
        const puntajeTotalReal = preguntasActivas.reduce(
          (sum, pregunta) => {
            const puntaje = Number(pregunta.puntaje);
            return sum + (isNaN(puntaje) || puntaje <= 0 ? 0 : puntaje);
          },
          0
        );

        // Validar que todas las preguntas requeridas tengan respuesta
        const preguntasRequeridas = preguntasActivas.filter((p) => p.requerida !== false);
        const preguntasRequeridasSinRespuesta = preguntasRequeridas.filter(
          (pregunta) => !respuestas.some((resp) => resp.pregunta.id === pregunta.id),
        );

        if (preguntasRequeridasSinRespuesta.length > 0) {
          console.warn('⚠️ Hay preguntas requeridas sin respuesta:', 
            preguntasRequeridasSinRespuesta.map((p) => ({ 
              id: p.id, 
              enunciado: p.enunciado.substring(0, 50) + '...',
              puntaje: p.puntaje,
            }))
          );
          // No lanzar error, pero registrar la advertencia para debugging
        }

        // SIEMPRE usar el puntaje total real calculado de las preguntas activas
        // Si es 0 o menor, significa que las preguntas no tienen puntaje configurado, usar el de la evaluación como fallback
        const puntajeTotalParaCalcular = puntajeTotalReal > 0 
          ? puntajeTotalReal 
          : Number(intento.evaluacion.puntajeTotal || 100);

        // Logs para debugging
        console.log('=== DEBUG FINISH ATTEMPT ===');
        console.log('Preguntas totales en evaluación:', intento.evaluacion.preguntas.length);
        console.log('Preguntas activas:', preguntasActivas.length);
        console.log('Preguntas requeridas:', preguntasRequeridas.length);
        console.log('Preguntas requeridas sin respuesta:', preguntasRequeridasSinRespuesta.length);
        console.log('Respuestas recibidas:', respuestas.length);
        console.log('Puntaje obtenido:', puntajeObtenido);
        console.log('Puntaje total real (suma de preguntas activas):', puntajeTotalReal);
        console.log('Puntaje total de evaluación (campo):', intento.evaluacion.puntajeTotal);
        console.log('Puntaje total para calcular porcentaje:', puntajeTotalParaCalcular);
        console.log('Minimo aprobacion:', intento.evaluacion.minimoAprobacion);

        // Calcular porcentaje usando el puntaje total real calculado (solo preguntas activas)
        // Asegurar que no haya división por cero
        porcentaje = puntajeTotalParaCalcular > 0
          ? this.scoringService.calculatePercentage(
              puntajeObtenido,
              puntajeTotalParaCalcular,
            )
          : 0;

        console.log('Porcentaje calculado:', porcentaje);
        console.log('Fórmula: (', puntajeObtenido, '/', puntajeTotalParaCalcular, ') * 100 =', porcentaje, '%');

        // Determinar si aprobó
        aprobado = this.scoringService.isPassed(
          porcentaje,
          Number(intento.evaluacion.minimoAprobacion),
        );

        console.log('Aprobado:', aprobado);
        console.log('=== FIN DEBUG ===');
      } else {
        console.log('=== ENCUESTA: NO SE CALCULAN PUNTAJES ===');
        console.log('Las respuestas se guardarán sin calificación');
        console.log('aprobado = null, puntajeObtenido = null, porcentaje = null');
      }

      // Calcular tiempo utilizado
      const fechaInicio = intento.fechaInicio;
      const fechaFinalizacion = new Date();
      const tiempoUtilizadoMs = fechaFinalizacion.getTime() - fechaInicio.getTime();
      const tiempoUtilizadoMinutos = Math.round(tiempoUtilizadoMs / (1000 * 60));

      // Actualizar puntajes en respuestas individuales (solo si NO es encuesta)
      if (!esEncuesta) {
        for (const respuesta of respuestas) {
          const pregunta = intento.evaluacion.preguntas.find((p) => p.id === respuesta.pregunta.id);
          if (pregunta) {
            const puntajePregunta = this.scoringService.calculateQuestionScore(pregunta, respuesta);
            respuesta.puntajeObtenido = puntajePregunta;
            await queryRunner.manager.save(respuesta);
          }
        }
      } else {
        // Para encuestas, no actualizar puntajes en respuestas individuales
        console.log('Encuesta: No se actualizan puntajes en respuestas individuales');
      }

      // Actualizar intento
      intento.fechaFinalizacion = fechaFinalizacion;
      // TAREA 1.1: Para encuestas, guardar null en puntajes y aprobación (FAL-001)
      intento.puntajeObtenido = esEncuesta ? null : puntajeObtenido;
      intento.porcentaje = porcentaje; // Ya es null si es encuesta
      intento.aprobado = aprobado; // Ya es null si es encuesta
      intento.tiempoUtilizadoMinutos = tiempoUtilizadoMinutos;
      intento.estado = EstadoIntento.COMPLETADO;

      const intentoFinalizado = await queryRunner.manager.save(intento);

      // Variable para almacenar información necesaria para generar certificado después del commit
      let inscripcionIdParaCertificado: number | null = null;
      let debeGenerarCertificado = false;

      // Si el estudiante aprobó, actualizar la inscripción y preparar generación de certificado
      // Solo si NO es encuesta (las encuestas no tienen aprobación)
      if (!esEncuesta && aprobado && intento.inscripcion) {
        console.log('=== INICIO VERIFICACIÓN PARA CERTIFICADO ===');
        console.log('Intento aprobado:', aprobado);
        console.log('ID Inscripción:', intento.inscripcion.id);
        console.log('ID Estudiante (desde intento):', intento.inscripcion?.estudiante?.id);

        // Actualizar inscripción con estado de aprobación
        const inscripcion = await queryRunner.manager.findOne(Inscripcion, {
          where: { id: intento.inscripcion.id },
          relations: [
            'capacitacion',
            'capacitacion.tipoCapacitacion',
            'estudiante',
          ],
        });

        if (!inscripcion) {
          console.error('ERROR: Inscripción no encontrada:', intento.inscripcion.id);
        } else {
          console.log('Inscripción encontrada:', inscripcion.id);
          console.log('ID Estudiante (desde inscripción):', inscripcion.estudiante?.id);
          inscripcion.aprobado = true;
          // porcentaje no puede ser null aquí porque no es encuesta (validado en el if)
          inscripcion.calificacionFinal = porcentaje !== null ? porcentaje : null;
          inscripcion.fechaFinalizacion = fechaFinalizacion;
          await queryRunner.manager.save(inscripcion);
          console.log('Inscripción actualizada con aprobado=true');

          // Verificar si la capacitación es de tipo "Certificada" (RF-22)
          const capacitacion = inscripcion.capacitacion;
          console.log('Capacitación ID:', capacitacion?.id);
          console.log('Tipo Capacitación:', capacitacion?.tipoCapacitacion);
          console.log('Código Tipo:', capacitacion?.tipoCapacitacion?.codigo);

          if (!capacitacion) {
            console.error('ERROR: Capacitación no encontrada en inscripción');
          } else if (!capacitacion.tipoCapacitacion) {
            console.error('ERROR: Tipo de capacitación no encontrado');
          } else if (
            capacitacion.tipoCapacitacion.codigo === 'CERTIFIED' ||
            capacitacion.tipoCapacitacion.codigo === 'CERTIFICADA'
          ) {
            console.log('✓ Capacitación es de tipo CERTIFIED, verificando certificado existente');

            // Verificar si ya existe un certificado para esta inscripción
            const existeCertificado = await queryRunner.manager.findOne(Certificado, {
              where: { inscripcion: { id: inscripcion.id } },
            });

            if (existeCertificado) {
              console.log(
                `⚠ Certificado ya existe para inscripción ${inscripcion.id}, no se generará otro`,
              );
            } else {
              console.log('✓ No existe certificado previo, se generará después del commit');
              inscripcionIdParaCertificado = inscripcion.id;
              debeGenerarCertificado = true;
            }
          } else {
            console.log(
              `⚠ Capacitación NO es de tipo CERTIFIED (código: ${capacitacion.tipoCapacitacion.codigo}), no se generará certificado`,
            );
          }
        }
        console.log('=== FIN VERIFICACIÓN PARA CERTIFICADO ===');
      }

      // Commit de la transacción PRIMERO
      await queryRunner.commitTransaction();

      // DESPUÉS del commit, generar el certificado si aplica
      // Esto evita problemas de transacciones anidadas
      if (debeGenerarCertificado && inscripcionIdParaCertificado) {
        try {
          console.log(
            `Generando certificado para inscripción ${inscripcionIdParaCertificado} (después del commit)...`,
          );
          await this.createCertificadoUseCase.execute({
            inscripcionId: inscripcionIdParaCertificado,
            esRetroactivo: false,
          });
          console.log(
            `✓ Certificado generado automáticamente para inscripción ${inscripcionIdParaCertificado}`,
          );
        } catch (error) {
          // Log del error pero no fallar (la transacción ya se completó)
          // El certificado puede generarse manualmente después
          console.error(
            `✗ Error al generar certificado automáticamente para inscripción ${inscripcionIdParaCertificado}:`,
            error,
          );
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
          }
        }
      }

      return intentoFinalizado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAttemptsByStudent(
    evaluacionId: number,
    inscripcionId: number,
  ): Promise<IntentoEvaluacion[]> {
    return this.intentoRepository.find({
      where: {
        evaluacion: { id: evaluacionId },
        inscripcion: { id: inscripcionId },
      },
      relations: [
        'evaluacion',
        'respuestas',
        'respuestas.pregunta',
        'respuestas.opcionRespuesta',
        'respuestas.respuestasMultiples',
        'respuestas.respuestasMultiples.opcionRespuesta',
      ],
      order: {
        numeroIntento: 'DESC',
      },
    });
  }

  async getAttemptById(intentoId: number): Promise<IntentoEvaluacion | null> {
    return this.intentoRepository.findOne({
      where: { id: intentoId },
      relations: [
        'evaluacion',
        'evaluacion.preguntas',
        'evaluacion.preguntas.opciones',
        'evaluacion.preguntas.tipoPregunta',
        'inscripcion',
        'respuestas',
        'respuestas.pregunta',
        'respuestas.opcionRespuesta',
        'respuestas.respuestasMultiples',
        'respuestas.respuestasMultiples.opcionRespuesta',
      ],
    });
  }

  async hasAttemptsAvailable(evaluacionId: number, inscripcionId: number): Promise<boolean> {
    const evaluacion = await this.evaluacionRepository.findOne({
      where: { id: evaluacionId },
    });

    if (!evaluacion) {
      return false;
    }

    const intentosExistentes = await this.intentoRepository.count({
      where: {
        evaluacion: { id: evaluacionId },
        inscripcion: { id: inscripcionId },
      },
    });

    return intentosExistentes < evaluacion.intentosPermitidos;
  }

  async getNextAttemptNumber(evaluacionId: number, inscripcionId: number): Promise<number> {
    const ultimoIntento = await this.intentoRepository.findOne({
      where: {
        evaluacion: { id: evaluacionId },
        inscripcion: { id: inscripcionId },
      },
      order: {
        numeroIntento: 'DESC',
      },
    });

    return ultimoIntento ? ultimoIntento.numeroIntento + 1 : 1;
  }
}

