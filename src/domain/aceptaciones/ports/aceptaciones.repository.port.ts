import { AceptacionPolitica } from '@/entities/aceptaciones/aceptacion-politica.entity';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';

export interface IAceptacionesRepository {
  /**
   * Obtiene todos los documentos legales activos
   */
  findDocumentosActivos(): Promise<DocumentoLegal[]>;

  /**
   * Obtiene un documento legal por ID
   */
  findDocumentoById(id: number): Promise<DocumentoLegal | null>;

  /**
   * Obtiene un documento legal por tipo
   */
  findDocumentoByTipo(tipo: string): Promise<DocumentoLegal | null>;

  /**
   * Verifica si un usuario ha aceptado todos los documentos legales activos
   */
  hasAceptadoTodosDocumentos(usuarioId: number): Promise<boolean>;

  /**
   * Obtiene las aceptaciones de un usuario
   */
  findAceptacionesByUsuario(usuarioId: number): Promise<AceptacionPolitica[]>;

  /**
   * Verifica si un usuario ha aceptado un documento específico
   */
  hasAceptadoDocumento(
    usuarioId: number,
    documentoId: number,
  ): Promise<boolean>;

  /**
   * Crea una nueva aceptación
   */
  createAceptacion(
    aceptacionData: Partial<AceptacionPolitica>,
  ): Promise<AceptacionPolitica>;
}
