import { Injectable, Inject } from '@nestjs/common';
import { IDocumentosLegalesRepository } from '@/domain/documentos-legales/ports/documentos-legales.repository.port';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';

@Injectable()
export class FindAllDocumentosLegalesUseCase {
  constructor(
    @Inject('IDocumentosLegalesRepository')
    private readonly documentosLegalesRepository: IDocumentosLegalesRepository,
  ) {}

  async execute(activo?: boolean): Promise<DocumentoLegal[]> {
    return this.documentosLegalesRepository.findAll(activo);
  }
}
