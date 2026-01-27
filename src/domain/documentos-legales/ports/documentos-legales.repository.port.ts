import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';
import {
  CreateDocumentoLegalDto,
  UpdateDocumentoLegalDto,
} from '@/application/documentos-legales/dto';

/**
 * Puerto para el repositorio de Documentos Legales
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IDocumentosLegalesRepository {
  /**
   * Crear un nuevo documento legal
   */
  create(
    createDto: CreateDocumentoLegalDto,
    creadoPorId: number,
  ): Promise<DocumentoLegal>;

  /**
   * Obtener todos los documentos legales
   */
  findAll(activo?: boolean): Promise<DocumentoLegal[]>;

  /**
   * Obtener un documento legal por ID
   */
  findOne(id: number): Promise<DocumentoLegal | null>;

  /**
   * Obtener documentos legales por tipo
   */
  findByTipo(tipo: string, activo?: boolean): Promise<DocumentoLegal[]>;

  /**
   * Actualizar un documento legal existente
   */
  update(
    id: number,
    updateDto: UpdateDocumentoLegalDto,
  ): Promise<DocumentoLegal>;

  /**
   * Eliminar (desactivar) un documento legal
   */
  remove(id: number): Promise<void>;
}
