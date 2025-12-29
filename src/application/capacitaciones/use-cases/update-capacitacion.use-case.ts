import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { UpdateCapacitacionDto } from '@/application/capacitaciones/dto/update-capacitacion.dto';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { EvaluacionValidatorService } from '@/infrastructure/shared/services/evaluacion-validator.service';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';

@Injectable()
export class UpdateCapacitacionUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
    private readonly evaluacionValidator: EvaluacionValidatorService,
  ) {}

  async execute(
    id: number,
    updateCapacitacionDto: UpdateCapacitacionDto,
  ): Promise<Capacitacion> {
    // Obtener la capacitación actual para conocer el estado actual
    const capacitacionActual = await this.capacitacionesRepository.findOne(id);
    if (!capacitacionActual) {
      throw new BadRequestException(`Capacitación con ID ${id} no encontrada`);
    }

    // Determinar el estado final después de la actualización
    const estadoFinal =
      updateCapacitacionDto.estado ?? capacitacionActual.estado;

    // Si el estado final es PUBLICADA, validar que tenga evaluación (RF-09)
    if (estadoFinal === EstadoCapacitacion.PUBLICADA) {
      await this.evaluacionValidator.validateCapacitacionHasEvaluation(id);
    }

    // Realizar la actualización
    return this.capacitacionesRepository.update(id, updateCapacitacionDto);
  }
}
