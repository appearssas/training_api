import { Injectable, Inject } from '@nestjs/common';
import { IMaterialesRepository } from '@/domain/materiales/ports/materiales.repository.port';
import { MaterialCapacitacion } from '@/entities/materiales/material-capacitacion.entity';

@Injectable()
export class FindMaterialsByCapacitacionUseCase {
  constructor(
    @Inject('IMaterialesRepository')
    private readonly materialesRepository: IMaterialesRepository,
  ) {}

  async execute(capacitacionId: number): Promise<MaterialCapacitacion[]> {
    return this.materialesRepository.findByCapacitacion(capacitacionId);
  }
}

