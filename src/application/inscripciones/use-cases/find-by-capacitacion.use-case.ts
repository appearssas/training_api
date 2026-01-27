import { Injectable, Inject } from '@nestjs/common';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Caso de uso: Obtener todas las inscripciones de una capacitación específica
 */
@Injectable()
export class FindByCapacitacionUseCase {
  constructor(
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
  ) {}

  async execute(
    capacitacionId: number,
    pagination?: PaginationDto,
  ): Promise<any> {
    return this.inscripcionesRepository.findByCapacitacion(
      capacitacionId,
      pagination || { page: 1, limit: 10 },
    );
  }
}
