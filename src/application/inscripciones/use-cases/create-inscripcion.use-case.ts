import { Injectable, Inject } from '@nestjs/common';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { CreateInscripcionDto } from '@/application/inscripciones/dto/create-inscripcion.dto';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { InscripcionValidatorService } from '@/infrastructure/shared/services/inscripcion-validator.service';
import { Usuario } from '@/entities/usuarios/usuario.entity';

/** Solo CLIENTE y OPERADOR tienen restricción por empresa. ADMIN e INSTRUCTOR pueden asignar cursos a quien sea, sin importar empresa. */
const ROLES_CON_RESTRICCION_EMPRESA = ['CLIENTE', 'OPERADOR'] as const;

/**
 * Caso de uso: Crear una nueva inscripción
 *
 * ADMIN/INSTRUCTOR: pueden inscribir a cualquier estudiante en cualquier curso (no aplican validaciones de empresa).
 * CLIENTE/OPERADOR: el curso debe estar asignado a su empresa y el estudiante debe ser de su empresa.
 */
@Injectable()
export class CreateInscripcionUseCase {
  constructor(
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
    private readonly inscripcionValidator: InscripcionValidatorService,
  ) {}

  async execute(
    createInscripcionDto: CreateInscripcionDto,
    user?: Usuario,
  ): Promise<Inscripcion> {
    const rol = user?.rolPrincipal?.codigo;
    const esClienteOOperador =
      rol != null && ROLES_CON_RESTRICCION_EMPRESA.includes(rol as any);
    const empresaId = esClienteOOperador
      ? (user?.persona?.empresaId ?? user?.persona?.empresa?.id)
      : undefined;

    // Solo CLIENTE/OPERADOR: validar curso asignado a su empresa y estudiante de su empresa. ADMIN/INSTRUCTOR omiten estas validaciones.
    if (empresaId != null) {
      await this.inscripcionValidator.validateCapacitacionAssignedToEmpresa(
        createInscripcionDto.capacitacionId,
        empresaId,
      );
      await this.inscripcionValidator.validateEstudianteBelongsToEmpresa(
        createInscripcionDto.estudianteId,
        empresaId,
      );
    }

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

    // 5. Valida el pago si se proporciona
    await this.inscripcionValidator.validatePago(createInscripcionDto.pagoId);

    // 6. Crear la inscripción
    return this.inscripcionesRepository.create(createInscripcionDto);
  }
}
