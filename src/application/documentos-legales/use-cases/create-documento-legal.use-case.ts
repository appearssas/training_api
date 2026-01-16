import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { IDocumentosLegalesRepository } from '@/domain/documentos-legales/ports/documentos-legales.repository.port';
import { CreateDocumentoLegalDto } from '@/application/documentos-legales/dto';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';

@Injectable()
export class CreateDocumentoLegalUseCase {
  constructor(
    @Inject('IDocumentosLegalesRepository')
    private readonly documentosLegalesRepository: IDocumentosLegalesRepository,
  ) {}

  async execute(
    createDto: CreateDocumentoLegalDto,
    creadoPorId: number,
  ): Promise<DocumentoLegal> {
    // Validaciones de negocio pueden ir aquí
    if (!createDto.contenido || createDto.contenido.trim().length === 0) {
      throw new BadRequestException(
        'El contenido del documento no puede estar vacío',
      );
    }

    return this.documentosLegalesRepository.create(createDto, creadoPorId);
  }
}
