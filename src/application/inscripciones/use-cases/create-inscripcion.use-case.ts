import { Injectable, Inject } from '@nestjs/common';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { CreateInscripcionDto } from '@/application/inscripciones/dto/create-inscripcion.dto';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { InscripcionValidatorService } from '@/infrastructure/shared/services/inscripcion-validator.service';

/**
 * Caso de uso: Crear una nueva inscripción
 * 
 * Reglas de negocio aplicadas:
 * - Valida que la capacitación esté disponible (PUBLICADA o EN_CURSO)
 * - Valida que el estudiante exista y esté activo
 * - Valida que no exista una inscripción duplicada
 * - Valida la capacidad máxima de la capacitación (si está definida)
 * - Valida el pago si se proporciona (requerido para conductores externos)
 */
@Injectable()
export class CreateInscripcionUseCase {
  constructor(
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
    private readonly inscripcionValidator: InscripcionValidatorService,
  ) {}

  async execute(createInscripcionDto: CreateInscripcionDto): Promise<Inscripcion> {
    // 1. Validar que la capacitación esté disponible para inscripciones
    await this.inscripcionValidator.validateCapacitacionDisponible(
      createInscripcionDto.capacitacionId,
    );

    // 2. Validar que el estudiante existe y está activo
    await this.inscripcionValidator.validateEstudiante(
      createInscripcionDto.estudianteId,
    );

    // 3. Validar que no exista una inscripción duplicada
    await this.inscripcionValidator.validateNoInscripcionDuplicada(
      createInscripcionDto.estudianteId,
      createInscripcionDto.capacitacionId,
    );

    // 4. Validar capacidad máxima (si está definida)
    await this.inscripcionValidator.validateCapacidadMaxima(
      createInscripcionDto.capacitacionId,
    );

    // 5. Validar el pago si se proporciona
    await this.inscripcionValidator.validatePago(createInscripcionDto.pagoId);

    // 6. Crear la inscripción
    return this.inscripcionesRepository.create(createInscripcionDto);
  }
}
