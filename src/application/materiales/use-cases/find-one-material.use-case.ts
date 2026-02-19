import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IMaterialesRepository } from '@/domain/materiales/ports/materiales.repository.port';
import { MaterialCapacitacion } from '@/entities/materiales/material-capacitacion.entity';

@Injectable()
export class FindOneMaterialUseCase {
  constructor(
    @Inject('IMaterialesRepository')
    private readonly materialesRepository: IMaterialesRepository,
  ) {}

  async execute(id: number): Promise<MaterialCapacitacion> {
    const material = await this.materialesRepository.findOne(id);
    if (!material) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }
    return material;
  }
}
