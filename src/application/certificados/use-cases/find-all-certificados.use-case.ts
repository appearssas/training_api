import { Injectable, Inject } from '@nestjs/common';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Caso de uso para obtener todos los certificados con paginación
 */
@Injectable()
export class FindAllCertificadosUseCase {
  constructor(
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
  ) {}

  async execute(pagination: PaginationDto) {
    return await this.certificadosRepository.findAll(pagination);
  }
}

