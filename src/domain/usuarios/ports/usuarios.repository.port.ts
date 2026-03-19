import { Usuario } from '@/entities/usuarios/usuario.entity';
import {
  UserSortField,
  SortOrder,
} from '@/application/usuarios/dto/list-users.dto';
import { UpdateUserDto } from '@/application/usuarios/dto/update-user.dto';

/**
 * Puerto para el repositorio de Usuarios
 */
export interface IUsuariosRepository {
  /**
   * Lista usuarios con paginación y filtros
   */
  findAll(filters: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    habilitado?: boolean;
    activo?: boolean;
    sortBy: UserSortField;
    sortOrder: SortOrder;
    empresaId?: number; // Filtro por empresa (para usuarios CLIENTE)
  }): Promise<{ usuarios: Usuario[]; total: number }>;

  /**
   * Lotes para exportación masiva: mismo filtrado que findAll, orden estable por `usuario.id ASC`,
   * cursor `afterUsuarioId` (0 = desde el principio). Evita OFFSET costoso en conjuntos grandes.
   */
  findAllForExportKeyset(
    filters: {
      search?: string;
      role?: string;
      habilitado?: boolean;
      activo?: boolean;
      empresaId?: number;
    },
    afterUsuarioId: number,
    limit: number,
  ): Promise<Usuario[]>;

  /**
   * Busca un usuario por su ID con todas las relaciones necesarias
   */
  findById(id: number): Promise<Usuario | null>;

  /**
   * Busca un usuario por su username
   */
  findByUsername(username: string): Promise<Usuario | null>;

  /**
   * Actualiza un usuario
   */
  update(id: number, updateData: UpdateUserDto): Promise<Usuario>;

  /**
   * Realiza un soft-delete de un usuario (marca como inactivo)
   */
  softDelete(id: number): Promise<void>;

  /**
   * Verifica si un username ya está en uso (excluyendo el usuario actual)
   */
  isUsernameTaken(username: string, excludeUserId?: number): Promise<boolean>;
}
