import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { IUsuariosRepository } from '@/domain/usuarios/ports/usuarios.repository.port';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { IProgresoLeccionRepository } from '@/domain/progreso/ports/progreso-leccion.repository.port';
import { StartIntentoUseCase } from '@/application/intentos/use-cases/start-intento.use-case';
import { SaveAnswerUseCase } from '@/application/intentos/use-cases/save-answer.use-case';
import { FinishIntentoUseCase } from '@/application/intentos/use-cases/finish-intento.use-case';
import { SubmitAnswerDto } from '@/application/intentos/dto/submit-answer.dto';
import { StartIntentoDto } from '@/application/intentos/dto/start-intento.dto';
import { EstadoInscripcion } from '@/entities/inscripcion/types';
import { UpdateInscripcionDto } from '@/application/inscripciones/dto/update-inscripcion.dto';
import { CompleteUserTrainingsResponseDto } from '../dto/complete-user-trainings-response.dto';
import { Pregunta } from '@/entities/evaluaciones/pregunta.entity';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';

const TIPOS_UNICA = ['SINGLE_CHOICE', 'TRUE_FALSE', 'YES_NO', 'SELECT_IMAGE'];
const TIPOS_MULTIPLE = ['MULTIPLE_CHOICE', 'MATCHING'];
const TIPOS_TEXTO = ['OPEN_TEXT', 'FILL_BLANKS'];

@Injectable()
export class CompleteUserTrainingsUseCase {
  private readonly logger = new Logger(CompleteUserTrainingsUseCase.name);

  constructor(
    @Inject('IUsuariosRepository')
    private readonly usuariosRepository: IUsuariosRepository,
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
    @Inject('IProgresoLeccionRepository')
    private readonly progresoLeccionRepository: IProgresoLeccionRepository,
    private readonly startIntentoUseCase: StartIntentoUseCase,
    private readonly saveAnswerUseCase: SaveAnswerUseCase,
    private readonly finishIntentoUseCase: FinishIntentoUseCase,
  ) {}

  async execute(userId: number): Promise<CompleteUserTrainingsResponseDto> {
    const usuario = await this.usuariosRepository.findById(userId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }
    const personaId = usuario.persona?.id;
    if (!personaId) {
      throw new NotFoundException(
        `El usuario ${userId} no tiene persona (estudiante) asociada`,
      );
    }

    const inscripciones =
      await this.inscripcionesRepository.findAllByEstudiante(personaId);
    const errors: string[] = [];
    let procesadas = 0;

    for (const inscripcion of inscripciones) {
      try {
        await this.completarInscripcion(
          inscripcion.id,
          inscripcion.capacitacion.id,
        );
        procesadas++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(
          `Inscripción ${inscripcion.id} (capacitación ${inscripcion.capacitacion.id}): ${msg}`,
        );
        this.logger.warn(
          `Error completando inscripción ${inscripcion.id}: ${msg}`,
        );
      }
    }

    return {
      userId,
      inscripcionesProcesadas: procesadas,
      message:
        procesadas === 0 && errors.length > 0
          ? 'No se completó ninguna capacitación.'
          : `Se completaron ${procesadas} capacitación(es) para el usuario.`,
      ...(errors.length > 0 && { errors }),
    };
  }

  private async completarInscripcion(
    inscripcionId: number,
    capacitacionId: number,
  ): Promise<void> {
    const capacitacion =
      await this.capacitacionesRepository.findOne(capacitacionId);
    if (!capacitacion) {
      throw new Error(`Capacitación ${capacitacionId} no encontrada`);
    }

    const leccionIds: number[] = [];
    if (capacitacion.secciones) {
      for (const seccion of capacitacion.secciones) {
        if (seccion.lecciones) {
          for (const leccion of seccion.lecciones) {
            leccionIds.push(leccion.id);
          }
        }
      }
    }
    await this.progresoLeccionRepository.markAllAsCompleted(
      inscripcionId,
      leccionIds,
    );

    const evaluaciones = capacitacion.evaluaciones || [];
    for (const evaluacion of evaluaciones) {
      await this.completarEvaluacion(evaluacion, inscripcionId);
    }

    const now = new Date();
    const updateDto: UpdateInscripcionDto = {
      estado: EstadoInscripcion.COMPLETADO,
      progresoPorcentaje: 100,
      fechaFinalizacion: now,
      aprobado: true,
      calificacionFinal: 100,
    };
    await this.inscripcionesRepository.update(inscripcionId, updateDto);
  }

  private async completarEvaluacion(
    evaluacion: Evaluacion,
    inscripcionId: number,
  ): Promise<void> {
    const startDto: StartIntentoDto = { inscripcionId };
    const intento = await this.startIntentoUseCase.execute(
      evaluacion.id,
      startDto,
    );

    const preguntas = evaluacion.preguntas || [];
    for (const pregunta of preguntas) {
      const dto = this.buildCorrectAnswerDto(pregunta);
      await this.saveAnswerUseCase.execute(intento.id, dto);
    }

    await this.finishIntentoUseCase.execute(intento.id);
  }

  private buildCorrectAnswerDto(pregunta: Pregunta): SubmitAnswerDto {
    const tipo = pregunta.tipoPregunta?.codigo ?? '';
    const opciones = pregunta.opciones || [];
    const fallbackTexto = 'Completado por administración';

    if (TIPOS_UNICA.includes(tipo)) {
      const correcta = opciones.find(o => o.esCorrecta);
      return {
        preguntaId: pregunta.id,
        ...(correcta
          ? { opcionRespuestaId: correcta.id }
          : { textoRespuesta: fallbackTexto }),
      };
    }
    if (TIPOS_MULTIPLE.includes(tipo)) {
      const correctas = opciones.filter(o => o.esCorrecta).map(o => o.id);
      return {
        preguntaId: pregunta.id,
        ...(correctas.length > 0
          ? { opcionRespuestaIds: correctas }
          : { textoRespuesta: fallbackTexto }),
      };
    }
    if (TIPOS_TEXTO.includes(tipo)) {
      return {
        preguntaId: pregunta.id,
        textoRespuesta: fallbackTexto,
      };
    }
    const correcta = opciones.find(o => o.esCorrecta);
    return {
      preguntaId: pregunta.id,
      ...(correcta
        ? { opcionRespuestaId: correcta.id }
        : { textoRespuesta: fallbackTexto }),
    };
  }
}
