import { Injectable, Inject } from '@nestjs/common';
import {
  ICertificadosRepository,
  CertificadosUserContext,
} from '@/domain/certificados/ports/certificados.repository.port';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Caso de uso para obtener todos los certificados con paginación.
 * Respetando visibilidad por rol: ADMIN ve todos; INSTRUCTOR los de sus cursos;
 * ALUMNO/CLIENTE/OPERADOR solo los propios (donde son el estudiante).
 */
@Injectable()
export class FindAllCertificadosUseCase {
  constructor(
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
  ) {}

  async execute(
    pagination: PaginationDto,
    userContext?: CertificadosUserContext,
  ) {
    return await this.certificadosRepository.findAll(pagination, userContext);
  }
}
