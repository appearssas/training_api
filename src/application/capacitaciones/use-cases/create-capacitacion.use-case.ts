import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { CreateCapacitacionDto } from '@/application/capacitaciones/dto/create-capacitacion.dto';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { EnteCertificador } from '@/entities/catalogos/ente-certificador.entity';
import { EvaluacionValidatorService } from '@/infrastructure/shared/services/evaluacion-validator.service';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';

/** ID del tipo de capacitación CERTIFIED (certificado) */
const TIPO_CAPACITACION_CERTIFIED = 2;

@Injectable()
export class CreateCapacitacionUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
    private readonly evaluacionValidator: EvaluacionValidatorService,
    @InjectRepository(EnteCertificador)
    private readonly enteCertificadorRepo: Repository<EnteCertificador>,
  ) {}

  async execute(
    createCapacitacionDto: CreateCapacitacionDto,
  ): Promise<Capacitacion> {
    if (createCapacitacionDto.tipoCapacitacionId === TIPO_CAPACITACION_CERTIFIED) {
      if (
        createCapacitacionDto.enteCertificadorId == null ||
        createCapacitacionDto.enteCertificadorId === undefined
      ) {
        throw new BadRequestException(
          'El ente certificador es obligatorio para capacitaciones de tipo CERTIFIED (Cesaroto, Andar del Llano, Confianza IPS).',
        );
      }
      const ente = await this.enteCertificadorRepo.findOne({
        where: { id: createCapacitacionDto.enteCertificadorId },
      });
      if (!ente) {
        throw new BadRequestException(
          `El ente certificador con ID ${createCapacitacionDto.enteCertificadorId} no existe.`,
        );
      }
    }

    // Validar que no exista una capacitación con el mismo título
    const existeDuplicado = await this.capacitacionesRepository.existsByTitulo(
      createCapacitacionDto.titulo,
    );

    if (existeDuplicado) {
      throw new ConflictException(
        `Ya existe una capacitación con el título "${createCapacitacionDto.titulo}". Por favor, use un título diferente.`,
      );
    }

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
