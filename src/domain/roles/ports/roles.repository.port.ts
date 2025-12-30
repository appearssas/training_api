import { Rol } from '@/entities/roles/rol.entity';

/**
 * Puerto para el repositorio de Roles
 */
export interface IRolesRepository {
  /**
   * Obtiene todos los roles activos
   */
  findAll(): Promise<Rol[]>;

  /**
   * Busca un rol por su código
   */
  findByCodigo(codigo: string): Promise<Rol | null>;

  /**
   * Busca un rol por su ID
   */
  findById(id: number): Promise<Rol | null>;
}

