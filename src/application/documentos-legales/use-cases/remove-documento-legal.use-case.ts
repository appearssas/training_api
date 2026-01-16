import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IDocumentosLegalesRepository } from '@/domain/documentos-legales/ports/documentos-legales.repository.port';

@Injectable()
export class RemoveDocumentoLegalUseCase {
  constructor(
    @Inject('IDocumentosLegalesRepository')
    private readonly documentosLegalesRepository: IDocumentosLegalesRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const documento = await this.documentosLegalesRepository.findOne(id);

    if (!documento) {
      throw new NotFoundException(`Documento legal con ID ${id} no encontrado`);
    }

    await this.documentosLegalesRepository.remove(id);
  }
}
