import { Injectable, Inject } from '@nestjs/common';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Caso de uso: Obtener todas las inscripciones con paginación
 */
@Injectable()
export class FindAllInscripcionesUseCase {
  constructor(
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
  ) {}

  async execute(pagination: PaginationDto): Promise<any> {
    return this.inscripcionesRepository.findAll(pagination);
  }
}
