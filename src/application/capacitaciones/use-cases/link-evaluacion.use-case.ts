import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { LinkEvaluacionDto } from '@/application/capacitaciones/dto/link-evaluacion.dto';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { EvaluacionValidatorService } from '@/infrastructure/shared/services/evaluacion-validator.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';

@Injectable()
export class LinkEvaluacionUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
    private readonly evaluacionValidator: EvaluacionValidatorService,
    @InjectRepository(Evaluacion)
    private readonly evaluacionRepository: Repository<Evaluacion>,
  ) {}

  async execute(
    capacitacionId: number,
    linkEvaluacionDto: LinkEvaluacionDto,
  ): Promise<Capacitacion> {
    // Validar que la capacitación exista
    const capacitacion =
      await this.capacitacionesRepository.findOne(capacitacionId);
    if (!capacitacion) {
      throw new BadRequestException(
        `Capacitación con ID ${capacitacionId} no encontrada`,
      );
    }

    // Validar que la evaluación exista y no esté ya vinculada
    await this.evaluacionValidator.validateEvaluationExists(
      linkEvaluacionDto.evaluacionId,
    );
    await this.evaluacionValidator.validateEvaluationNotLinked(
      linkEvaluacionDto.evaluacionId,
      capacitacionId,
    );

    // Vincular la evaluación a la capacitación
    const evaluacion = await this.evaluacionRepository.findOne({
      where: { id: linkEvaluacionDto.evaluacionId },
    });

    if (evaluacion) {
      evaluacion.capacitacion = capacitacion as any;
      await this.evaluacionRepository.save(evaluacion);
    }

    // Retornar la capacitación actualizada con sus evaluaciones
    const capacitacionActualizada =
      await this.capacitacionesRepository.findOne(capacitacionId);
    if (!capacitacionActualizada) {
      throw new BadRequestException(
        `Error al obtener la capacitación actualizada con ID ${capacitacionId}`,
      );
    }
    return capacitacionActualizada;
  }
}
