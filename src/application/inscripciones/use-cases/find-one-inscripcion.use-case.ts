import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';

/**
 * Caso de uso: Obtener una inscripción por ID
 */
@Injectable()
export class FindOneInscripcionUseCase {
  constructor(
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
  ) {}

  async execute(id: number): Promise<Inscripcion> {
    const inscripcion = await this.inscripcionesRepository.findOne(id);
    if (!inscripcion) {
      throw new NotFoundException(`Inscripción con ID ${id} no encontrada`);
    }
    return inscripcion;
  }
}
