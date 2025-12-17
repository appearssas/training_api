import { Injectable, Inject } from '@nestjs/common';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { UpdateCapacitacionDto } from '@/application/capacitaciones/dto/update-capacitacion.dto';
import { Capacitacion } from '@/entities/capacitacion.entity';

@Injectable()
export class UpdateCapacitacionUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
  ) {}

  async execute(
    id: number,
    updateCapacitacionDto: UpdateCapacitacionDto,
  ): Promise<Capacitacion> {
    return this.capacitacionesRepository.update(id, updateCapacitacionDto);
  }
}
