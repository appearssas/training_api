import { Usuario } from '@/entities/usuarios/usuario.entity';
import {
  ListUsersDto,
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
