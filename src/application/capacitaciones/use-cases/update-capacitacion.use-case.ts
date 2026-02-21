import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { UpdateCapacitacionDto } from '@/application/capacitaciones/dto/update-capacitacion.dto';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { EnteCertificador } from '@/entities/catalogos/ente-certificador.entity';
import { EvaluacionValidatorService } from '@/infrastructure/shared/services/evaluacion-validator.service';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';

/** ID del tipo de capacitación CERTIFIED (certificado) */
const TIPO_CAPACITACION_CERTIFIED = 2;

@Injectable()
export class UpdateCapacitacionUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
    private readonly evaluacionValidator: EvaluacionValidatorService,
    @InjectRepository(EnteCertificador)
    private readonly enteCertificadorRepo: Repository<EnteCertificador>,
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

    const tipoFinal =
      updateCapacitacionDto.tipoCapacitacionId ??
      (capacitacionActual.tipoCapacitacion as { id?: number })?.id;
    const enteIdFinal =
      updateCapacitacionDto.enteCertificadorId !== undefined
        ? updateCapacitacionDto.enteCertificadorId
        : (capacitacionActual.enteCertificador as { id?: number } | null)?.id ??
          null;

    if (tipoFinal === TIPO_CAPACITACION_CERTIFIED) {
      if (enteIdFinal == null || enteIdFinal === undefined) {
        throw new BadRequestException(
          'El ente certificador es obligatorio para capacitaciones de tipo CERTIFIED (Cesaroto, Andar del Llano, Confianza IPS).',
        );
      }
      const ente = await this.enteCertificadorRepo.findOne({
        where: { id: enteIdFinal },
      });
      if (!ente) {
        throw new BadRequestException(
          `El ente certificador con ID ${enteIdFinal} no existe.`,
        );
      }
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
