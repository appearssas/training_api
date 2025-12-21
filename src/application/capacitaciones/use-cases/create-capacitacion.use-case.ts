import { Injectable, Inject } from '@nestjs/common';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { CreateCapacitacionDto } from '@/application/capacitaciones/dto/create-capacitacion.dto';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { EvaluacionValidatorService } from '@/infrastructure/shared/services/evaluacion-validator.service';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';

@Injectable()
export class CreateCapacitacionUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
    private readonly evaluacionValidator: EvaluacionValidatorService,
  ) {}

  async execute(
    createCapacitacionDto: CreateCapacitacionDto,
  ): Promise<Capacitacion> {
    const capacitacion = await this.capacitacionesRepository.create(
      createCapacitacionDto,
    );

    // Validar evaluación obligatoria solo si el estado es PUBLICADA (RF-09)
    if (createCapacitacionDto.estado === EstadoCapacitacion.PUBLICADA) {
      await this.evaluacionValidator.validateCapacitacionHasEvaluation(
        capacitacion.id,
      );
    }

    return capacitacion;
  }
}
