import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';

/**
 * Caso de uso: Eliminar una inscripción
 */
@Injectable()
export class RemoveInscripcionUseCase {
  constructor(
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
  ) {}

  async execute(id: number): Promise<void> {
    // Verificar que la inscripción existe antes de eliminar
    const existe = await this.inscripcionesRepository.findOne(id);
    if (!existe) {
      throw new NotFoundException(`Inscripción con ID ${id} no encontrada`);
    }

    return this.inscripcionesRepository.remove(id);
  }
}
