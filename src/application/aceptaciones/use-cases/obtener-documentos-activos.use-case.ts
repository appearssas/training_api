import {
  Injectable,
  Inject,
} from '@nestjs/common';
import { IAceptacionesRepository } from '@/domain/aceptaciones/ports/aceptaciones.repository.port';
import { DocumentoLegalActivoResponseDto } from '../dto/documento-legal-response.dto';

@Injectable()
export class ObtenerDocumentosActivosUseCase {
  constructor(
    @Inject('IAceptacionesRepository')
    private readonly aceptacionesRepository: IAceptacionesRepository,
  ) {}

  async execute(): Promise<DocumentoLegalActivoResponseDto[]> {
    const documentos =
      await this.aceptacionesRepository.findDocumentosActivos();

    return documentos.map((doc) => ({
      id: doc.id,
      tipo: doc.tipo,
      titulo: doc.titulo,
      contenido: doc.contenido,
      version: doc.version,
      requiereFirmaDigital: Boolean(doc.requiereFirmaDigital),
      activo: Boolean(doc.activo),
    }));
  }
}

