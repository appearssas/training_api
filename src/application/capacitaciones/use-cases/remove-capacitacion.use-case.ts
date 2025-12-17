import { Injectable, Inject } from '@nestjs/common';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';

@Injectable()
export class RemoveCapacitacionUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
  ) {}

  async execute(id: number): Promise<void> {
    return this.capacitacionesRepository.remove(id);
  }
}
