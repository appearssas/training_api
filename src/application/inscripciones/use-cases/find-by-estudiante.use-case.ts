import { Injectable, Inject } from '@nestjs/common';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Caso de uso: Obtener todas las inscripciones de un estudiante específico
 */
@Injectable()
export class FindByEstudianteUseCase {
  constructor(
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
  ) {}

  async execute(
    estudianteId: number,
    pagination?: PaginationDto,
  ): Promise<any> {
    return this.inscripcionesRepository.findByEstudiante(
      estudianteId,
      pagination || { page: 1, limit: 10 },
    );
  }
}
