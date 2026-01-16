import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IDocumentosLegalesRepository } from '@/domain/documentos-legales/ports/documentos-legales.repository.port';
import { UpdateDocumentoLegalDto } from '@/application/documentos-legales/dto';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';

@Injectable()
export class UpdateDocumentoLegalUseCase {
  constructor(
    @Inject('IDocumentosLegalesRepository')
    private readonly documentosLegalesRepository: IDocumentosLegalesRepository,
  ) {}

  async execute(
    id: number,
    updateDto: UpdateDocumentoLegalDto,
  ): Promise<DocumentoLegal> {
    const documento = await this.documentosLegalesRepository.findOne(id);

    if (!documento) {
      throw new NotFoundException(`Documento legal con ID ${id} no encontrado`);
    }

    return this.documentosLegalesRepository.update(id, updateDto);
  }
}
