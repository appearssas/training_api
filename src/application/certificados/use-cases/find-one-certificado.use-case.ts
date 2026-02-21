import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';
import { Certificado } from '@/entities/certificados/certificado.entity';

/**
 * Caso de uso para obtener un certificado por ID
 */
@Injectable()
export class FindOneCertificadoUseCase {
  constructor(
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
  ) {}

  async execute(id: number): Promise<Certificado> {
    const certificado = await this.certificadosRepository.findOne(id);

    if (!certificado) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
    }

    return certificado;
  }
}
