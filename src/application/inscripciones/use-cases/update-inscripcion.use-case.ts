import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { UpdateInscripcionDto } from '@/application/inscripciones/dto/update-inscripcion.dto';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';

/**
 * Caso de uso: Actualizar una inscripción existente
 */
@Injectable()
export class UpdateInscripcionUseCase {
  constructor(
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
  ) {}

  async execute(
    id: number,
    updateInscripcionDto: UpdateInscripcionDto,
  ): Promise<Inscripcion> {
    // Verificar que la inscripción existe
    const existe = await this.inscripcionesRepository.findOne(id);
    if (!existe) {
      throw new NotFoundException(`Inscripción con ID ${id} no encontrada`);
    }

    return this.inscripcionesRepository.update(id, updateInscripcionDto);
  }
}
