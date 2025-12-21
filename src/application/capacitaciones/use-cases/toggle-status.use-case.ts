import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';
import { CertificadoValidatorService } from '@/infrastructure/shared/services/certificado-validator.service';
import { EvaluacionValidatorService } from '@/infrastructure/shared/services/evaluacion-validator.service';

/**
 * Use Case para cambiar el estado de una capacitación (RF-10)
 * Permite activar/desactivar cursos sin afectar certificados ya emitidos
 */
@Injectable()
export class ToggleStatusUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
    private readonly certificadoValidator: CertificadoValidatorService,
    private readonly evaluacionValidator: EvaluacionValidatorService,
  ) {}

  async execute(
    id: number,
    nuevoEstado: EstadoCapacitacion,
  ): Promise<Capacitacion> {
    // Verificar que la capacitación exista
    const capacitacion = await this.capacitacionesRepository.findOne(id);
    if (!capacitacion) {
      throw new NotFoundException(`Capacitación con ID ${id} no encontrada`);
    }

    // Validar que no se intente cambiar al mismo estado
    if (capacitacion.estado === nuevoEstado) {
      throw new BadRequestException(
        `La capacitación ya está en estado "${nuevoEstado}"`,
      );
    }

    // Validar certificados existentes (RF-10: no deben afectarse)
    const certificadosInfo = await this.certificadoValidator.validateEstadoChange(
      id,
    );

    // Si se intenta publicar, validar que tenga evaluación (RF-09)
    if (nuevoEstado === EstadoCapacitacion.PUBLICADA) {
      await this.evaluacionValidator.validateCapacitacionHasEvaluation(id);
    }

    // Actualizar el estado
    const capacitacionActualizada = await this.capacitacionesRepository.update(
      id,
      { estado: nuevoEstado },
    );

    // Retornar información adicional sobre certificados si existen
    // (solo para logging/información, no bloquea la operación según RF-10)
    if (certificadosInfo.hasCertificados) {
      // Log informativo (en producción podría enviarse a un sistema de logging)
      console.log(
        `Capacitación ${id} cambió de estado. Certificados existentes: ${certificadosInfo.count}. Estos no se afectan según RF-10.`,
      );
    }

    return capacitacionActualizada;
  }

  /**
   * Método helper para toggle entre activo/inactivo
   * Activo = PUBLICADA o EN_CURSO
   * Inactivo = BORRADOR, FINALIZADA o CANCELADA
   */
  async toggleActivoInactivo(id: number): Promise<Capacitacion> {
    const capacitacion = await this.capacitacionesRepository.findOne(id);
    if (!capacitacion) {
      throw new NotFoundException(`Capacitación con ID ${id} no encontrada`);
    }

    // Determinar el nuevo estado según el estado actual
    let nuevoEstado: EstadoCapacitacion;

    if (
      capacitacion.estado === EstadoCapacitacion.PUBLICADA ||
      capacitacion.estado === EstadoCapacitacion.EN_CURSO
    ) {
      // Si está activa, desactivar (cambiar a BORRADOR)
      nuevoEstado = EstadoCapacitacion.BORRADOR;
    } else {
      // Si está inactiva, activar (cambiar a PUBLICADA)
      // Pero primero validar que tenga evaluación
      await this.evaluacionValidator.validateCapacitacionHasEvaluation(id);
      nuevoEstado = EstadoCapacitacion.PUBLICADA;
    }

    return this.execute(id, nuevoEstado);
  }
}

