import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { Persona } from '@/entities/persona/persona.entity';
import { Pago } from '@/entities/pagos/pago.entity';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { EmpresasCapacitacionesService } from '@/infrastructure/empresas/empresas-capacitaciones.service';

/**
 * Servicio de validación para inscripciones
 * Centraliza las reglas de negocio relacionadas con inscripciones
 */
@Injectable()
export class InscripcionValidatorService {
  constructor(
    @InjectRepository(Capacitacion)
    private readonly capacitacionRepository: Repository<Capacitacion>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
    private readonly empresasCapacitacionesService: EmpresasCapacitacionesService,
  ) {}

  /**
   * Valida que la capacitación esté disponible para inscripciones
   * Una capacitación está disponible si está en estado PUBLICADA o EN_CURSO
   */
  async validateCapacitacionDisponible(
    capacitacionId: number,
  ): Promise<Capacitacion> {
    const capacitacion = await this.capacitacionRepository.findOne({
      where: { id: capacitacionId },
    });

    if (!capacitacion) {
      throw new NotFoundException(
        `Capacitación con ID ${capacitacionId} no encontrada`,
      );
    }

    // Validar que la capacitación esté en un estado que permita inscripciones
    const estadosPermitidos = [
      EstadoCapacitacion.PUBLICADA,
      EstadoCapacitacion.EN_CURSO,
    ];

    if (!estadosPermitidos.includes(capacitacion.estado)) {
      throw new BadRequestException(
        `No se puede inscribir a una capacitación en estado "${capacitacion.estado}". ` +
          `Solo se permiten inscripciones en capacitaciones con estado: ${estadosPermitidos.join(' o ')}`,
      );
    }

    return capacitacion;
  }

  /**
   * Valida que el estudiante existe y está activo
   */
  async validateEstudiante(estudianteId: number): Promise<Persona> {
    const estudiante = await this.personaRepository.findOne({
      where: { id: estudianteId },
      relations: ['usuario'],
    });

    if (!estudiante) {
      throw new NotFoundException(
        `Estudiante con ID ${estudianteId} no encontrado`,
      );
    }

    if (!estudiante.activo) {
      throw new BadRequestException(
        `El estudiante con ID ${estudianteId} está inactivo`,
      );
    }

    return estudiante;
  }

  /**
   * Valida que no exista una inscripción previa del estudiante a la capacitación
   */
  async validateNoInscripcionDuplicada(
    estudianteId: number,
    capacitacionId: number,
  ): Promise<void> {
    const existeInscripcion =
      await this.inscripcionesRepository.existsByEstudianteAndCapacitacion(
        estudianteId,
        capacitacionId,
      );

    if (existeInscripcion) {
      throw new BadRequestException(
        `El estudiante con ID ${estudianteId} ya está inscrito en la capacitación con ID ${capacitacionId}`,
      );
    }
  }

  /**
   * Valida la capacidad máxima de la capacitación
   */
  async validateCapacidadMaxima(capacitacionId: number): Promise<void> {
    const capacitacion = await this.capacitacionRepository.findOne({
      where: { id: capacitacionId },
    });

    if (!capacitacion || !capacitacion.capacidadMaxima) {
      // Si no hay capacidad máxima definida, no validar
      return;
    }

    // Contar inscripciones activas (no abandonadas)
    // Usamos una consulta directa para evitar problemas de dependencia circular
    const inscripcionesActivas =
      await this.inscripcionesRepository.findByCapacitacion(
        capacitacionId,
        { page: 1, limit: 1000 }, // Límite alto para obtener todas
      );

    const totalActivas =
      inscripcionesActivas.data?.filter(
        (inscripcion: any) => inscripcion.estado !== 'abandonado',
      ).length ||
      inscripcionesActivas.total ||
      0;

    if (totalActivas >= capacitacion.capacidadMaxima) {
      throw new BadRequestException(
        `La capacitación ha alcanzado su capacidad máxima de ${capacitacion.capacidadMaxima} estudiantes`,
      );
    }
  }

  /**
   * Valida que el pago existe si se proporciona (requerido para conductores externos)
   */
  async validatePago(pagoId: number | null | undefined): Promise<void> {
    if (!pagoId) {
      return; // El pago es opcional para estudiantes internos
    }

    const pago = await this.pagoRepository.findOne({
      where: { id: pagoId, activo: true },
    });

    if (!pago) {
      throw new NotFoundException(
        `Pago con ID ${pagoId} no encontrado o inactivo`,
      );
    }
  }

  /**
   * Para cliente institucional: valida que la capacitación esté asignada a su empresa (por admin).
   */
  async validateCapacitacionAssignedToEmpresa(
    capacitacionId: number,
    empresaId: number,
  ): Promise<void> {
    const assigned =
      await this.empresasCapacitacionesService.isCapacitacionAssignedToEmpresa(
        capacitacionId,
        empresaId,
      );
    if (!assigned) {
      throw new BadRequestException(
        `La capacitación con ID ${capacitacionId} no está asignada a su empresa. Solo puede inscribir usuarios en los cursos que el administrador asignó a su empresa.`,
      );
    }
  }

  /**
   * Para cliente institucional: valida que el estudiante pertenezca a la empresa del usuario.
   */
  async validateEstudianteBelongsToEmpresa(
    estudianteId: number,
    empresaId: number,
  ): Promise<void> {
    const persona = await this.personaRepository.findOne({
      where: { id: estudianteId },
    });
    if (!persona) {
      throw new NotFoundException(
        `Estudiante con ID ${estudianteId} no encontrado`,
      );
    }
    if (persona.empresaId !== empresaId) {
      throw new BadRequestException(
        `Solo puede inscribir usuarios de su empresa. El estudiante con ID ${estudianteId} no pertenece a su empresa.`,
      );
    }
  }
}
