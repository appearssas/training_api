import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { IIntentosRepository } from '@/domain/intentos/ports/intentos.repository.port';
import { IEvaluacionesRepository } from '@/domain/evaluaciones/ports/evaluaciones.repository.port';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { StartIntentoDto } from '../dto/start-intento.dto';
import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';
import { EstadoIntento } from '@/entities/evaluaciones/types';

/**
 * Caso de uso para iniciar un intento de evaluación
 * Valida que el estudiante tenga intentos disponibles
 * Sigue el principio de Responsabilidad Única (SOLID)
 */
@Injectable()
export class StartIntentoUseCase {
  constructor(
    @Inject('IIntentosRepository')
    private readonly intentosRepository: IIntentosRepository,
    @Inject('IEvaluacionesRepository')
    private readonly evaluacionesRepository: IEvaluacionesRepository,
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
  ) {}

  async execute(evaluacionId: number, dto: StartIntentoDto): Promise<IntentoEvaluacion> {
    // Validar que la evaluación existe
    const evaluacion = await this.evaluacionesRepository.findOne(evaluacionId);
    if (!evaluacion) {
      throw new NotFoundException(`Evaluación con ID ${evaluacionId} no encontrada`);
    }

    // Validar que la inscripción existe
    const inscripcion = await this.inscripcionesRepository.findOne(dto.inscripcionId);
    if (!inscripcion) {
      throw new NotFoundException(`Inscripción con ID ${dto.inscripcionId} no encontrada`);
    }

    // Validar que la inscripción pertenece a la capacitación de la evaluación
    if (inscripcion.capacitacion.id !== evaluacion.capacitacion.id) {
      throw new BadRequestException(
        'La inscripción no corresponde a la capacitación de esta evaluación',
      );
    }

    // Verificar intentos disponibles
    const hasAttempts = await this.intentosRepository.hasAttemptsAvailable(
      evaluacionId,
      dto.inscripcionId,
    );

    if (!hasAttempts) {
      throw new BadRequestException(
        `No tienes intentos disponibles. Máximo permitido: ${evaluacion.intentosPermitidos}`,
      );
    }

    // Crear el intento (el repositorio calculará el número de intento internamente)
    const intento = await this.intentosRepository.startAttempt(evaluacionId, dto);

    return intento;
  }
}

