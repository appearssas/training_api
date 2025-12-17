import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';

@Injectable()
export class FindOneCapacitacionUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
  ) {}

  async execute(id: number): Promise<Capacitacion> {
    const capacitacion = await this.capacitacionesRepository.findOne(id);
    if (!capacitacion) {
      throw new NotFoundException(`Capacitación con ID ${id} no encontrada`);
    }
    return capacitacion;
  }
}
