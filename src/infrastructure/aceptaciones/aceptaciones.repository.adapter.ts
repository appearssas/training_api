import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAceptacionesRepository } from '@/domain/aceptaciones/ports/aceptaciones.repository.port';
import { AceptacionPolitica } from '@/entities/aceptaciones/aceptacion-politica.entity';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';

@Injectable()
export class AceptacionesRepositoryAdapter implements IAceptacionesRepository {
  constructor(
    @InjectRepository(DocumentoLegal)
    private readonly documentoLegalRepository: Repository<DocumentoLegal>,
    @InjectRepository(AceptacionPolitica)
    private readonly aceptacionRepository: Repository<AceptacionPolitica>,
  ) {}

  async findDocumentosActivos(): Promise<DocumentoLegal[]> {
    return await this.documentoLegalRepository.find({
      where: { activo: true },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findDocumentoById(id: number): Promise<DocumentoLegal | null> {
    return await this.documentoLegalRepository.findOne({
      where: { id },
    });
  }

  async findDocumentoByTipo(tipo: string): Promise<DocumentoLegal | null> {
    return await this.documentoLegalRepository.findOne({
      where: { tipo, activo: true },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async hasAceptadoTodosDocumentos(usuarioId: number): Promise<boolean> {
    // Obtener todos los documentos activos
    const documentosActivos = await this.findDocumentosActivos();

    if (documentosActivos.length === 0) {
      // Si no hay documentos activos, se considera aceptado
      return true;
    }

    // Obtener todas las aceptaciones del usuario
    const aceptaciones = await this.findAceptacionesByUsuario(usuarioId);
    const documentosAceptadosIds = aceptaciones.map(
      (aceptacion) => aceptacion.documentoLegal.id,
    );

    // Verificar que el usuario haya aceptado todos los documentos activos
    const todosAceptados = documentosActivos.every((documento) =>
      documentosAceptadosIds.includes(documento.id),
    );

    return todosAceptados;
  }

  async findAceptacionesByUsuario(
    usuarioId: number,
  ): Promise<AceptacionPolitica[]> {
    return await this.aceptacionRepository.find({
      where: { usuario: { id: usuarioId } },
      relations: ['documentoLegal'],
      order: { fechaAceptacion: 'DESC' },
    });
  }

  async hasAceptadoDocumento(
    usuarioId: number,
    documentoId: number,
  ): Promise<boolean> {
    const aceptacion = await this.aceptacionRepository.findOne({
      where: {
        usuario: { id: usuarioId },
        documentoLegal: { id: documentoId },
      },
    });

    return aceptacion !== null;
  }

  async createAceptacion(
    aceptacionData: Partial<AceptacionPolitica>,
  ): Promise<AceptacionPolitica> {
    const aceptacion = this.aceptacionRepository.create(aceptacionData);
    return await this.aceptacionRepository.save(aceptacion);
  }
}
