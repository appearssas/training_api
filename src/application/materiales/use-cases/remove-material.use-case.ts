import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IMaterialesRepository } from '@/domain/materiales/ports/materiales.repository.port';

@Injectable()
export class RemoveMaterialUseCase {
  constructor(
    @Inject('IMaterialesRepository')
    private readonly materialesRepository: IMaterialesRepository,
  ) {}

  async execute(id: number): Promise<void> {
    // Verificar que el material exista
    const material = await this.materialesRepository.findOne(id);
    if (!material) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }

    await this.materialesRepository.remove(id);
  }
}
