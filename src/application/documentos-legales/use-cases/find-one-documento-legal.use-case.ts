import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IDocumentosLegalesRepository } from '@/domain/documentos-legales/ports/documentos-legales.repository.port';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';

@Injectable()
export class FindOneDocumentoLegalUseCase {
  constructor(
    @Inject('IDocumentosLegalesRepository')
    private readonly documentosLegalesRepository: IDocumentosLegalesRepository,
  ) {}

  async execute(id: number): Promise<DocumentoLegal> {
    const documento = await this.documentosLegalesRepository.findOne(id);

    if (!documento) {
      throw new NotFoundException(`Documento legal con ID ${id} no encontrado`);
    }

    return documento;
  }
}
