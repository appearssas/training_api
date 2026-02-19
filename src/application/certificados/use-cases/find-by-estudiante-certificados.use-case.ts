import { Injectable, Inject } from '@nestjs/common';
import {
  ICertificadosRepository,
  CertificadosUserContext,
} from '@/domain/certificados/ports/certificados.repository.port';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Caso de uso para obtener certificados de un estudiante específico.
 * CLIENTE/OPERADOR solo ven certificados de estudiantes de su empresa.
 */
@Injectable()
export class FindByEstudianteCertificadosUseCase {
  constructor(
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
  ) {}

  async execute(
    estudianteId: number,
    pagination?: PaginationDto,
    userContext?: CertificadosUserContext,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.certificadosRepository.findByEstudiante(
      estudianteId,
      pagination,
      userContext,
    );
    return result as {
      data: unknown[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }
}
