import { Injectable, Inject } from '@nestjs/common';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Caso de uso para obtener certificados de un estudiante específico
 */
@Injectable()
export class FindByEstudianteCertificadosUseCase {
  constructor(
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
  ) {}

  async execute(estudianteId: number, pagination?: PaginationDto) {
    return await this.certificadosRepository.findByEstudiante(estudianteId, pagination);
  }
}

