import { Injectable, Inject } from '@nestjs/common';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { CreateCapacitacionDto } from '@/application/capacitaciones/dto/create-capacitacion.dto';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';

@Injectable()
export class CreateCapacitacionUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
  ) {}

  async execute(
    createCapacitacionDto: CreateCapacitacionDto,
  ): Promise<Capacitacion> {
    return this.capacitacionesRepository.create(createCapacitacionDto);
  }
}
