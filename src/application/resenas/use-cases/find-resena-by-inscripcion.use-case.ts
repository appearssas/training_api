import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IResenasRepository } from '@/domain/resenas/ports/resenas.repository.port';
import { Resena } from '@/entities/resenas/resena.entity';

/**
 * Caso de uso: Obtener una reseña por inscripción
 */
@Injectable()
export class FindResenaByInscripcionUseCase {
  constructor(
    @Inject('IResenasRepository')
    private readonly resenasRepository: IResenasRepository,
  ) {}

  async execute(inscripcionId: number): Promise<Resena | null> {
    return this.resenasRepository.findByInscripcion(inscripcionId);
  }
}
