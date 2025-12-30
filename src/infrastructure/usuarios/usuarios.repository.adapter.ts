import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { IUsuariosRepository } from '@/domain/usuarios/ports/usuarios.repository.port';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Rol } from '@/entities/roles/rol.entity';
import { UpdateUserDto } from '@/application/usuarios/dto/update-user.dto';
import { UserSortField, SortOrder } from '@/application/usuarios/dto/list-users.dto';

@Injectable()
export class UsuariosRepositoryAdapter implements IUsuariosRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async findAll(filters: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    habilitado?: boolean;
    activo?: boolean;
    sortBy: UserSortField;
    sortOrder: SortOrder;
  }): Promise<{ usuarios: Usuario[]; total: number }> {
    const queryBuilder = this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.persona', 'persona')
      .leftJoinAndSelect('usuario.rolPrincipal', 'rolPrincipal');

    // Filtro por búsqueda (username, email, número de documento)
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      queryBuilder.andWhere(
        '(usuario.username LIKE :search OR persona.email LIKE :search OR persona.numeroDocumento LIKE :search)',
        { search: searchTerm },
      );
    }

    // Filtro por rol
    if (filters.role) {
      queryBuilder.andWhere('rolPrincipal.codigo = :role', { role: filters.role });
    }

    // Filtro por habilitado
    if (filters.habilitado !== undefined) {
      queryBuilder.andWhere('usuario.habilitado = :habilitado', {
        habilitado: filters.habilitado,
      });
    }

    // Filtro por activo (solo mostrar usuarios activos por defecto, a menos que se especifique)
    if (filters.activo !== undefined) {
      queryBuilder.andWhere('usuario.activo = :activo', {
        activo: filters.activo,
      });
    } else {
      // Por defecto, solo mostrar usuarios activos
      queryBuilder.andWhere('usuario.activo = :activo', { activo: true });
    }

    // Ordenamiento
    const sortField = this.getSortField(filters.sortBy);
    queryBuilder.orderBy(sortField, filters.sortOrder);

    // Paginación
    const skip = (filters.page - 1) * filters.limit;
    queryBuilder.skip(skip).take(filters.limit);

    // Obtener total y resultados
    const [usuarios, total] = await queryBuilder.getManyAndCount();

    return { usuarios, total };
  }

  async findById(id: number): Promise<Usuario | null> {
    return await this.usuarioRepository.findOne({
      where: { id },
      relations: ['persona', 'rolPrincipal'],
    });
  }

  async findByUsername(username: string): Promise<Usuario | null> {
    return await this.usuarioRepository.findOne({
      where: { username },
      relations: ['persona', 'rolPrincipal'],
    });
  }

  async update(id: number, updateData: UpdateUserDto): Promise<Usuario> {
    const updatePayload: any = {};

    if (updateData.username !== undefined) {
      updatePayload.username = updateData.username;
    }

    if (updateData.rolPrincipalId !== undefined) {
      // Necesitamos cargar el rol primero
      const rol = await this.usuarioRepository.manager.findOne(Rol, {
        where: { id: updateData.rolPrincipalId },
      });
      if (!rol) {
        throw new Error(`Rol con ID ${updateData.rolPrincipalId} no encontrado`);
      }
      updatePayload.rolPrincipal = rol;
    }

    if (updateData.habilitado !== undefined) {
      updatePayload.habilitado = updateData.habilitado;
    }

    if (updateData.activo !== undefined) {
      updatePayload.activo = updateData.activo;
    }

    if (updateData.debeCambiarPassword !== undefined) {
      updatePayload.debeCambiarPassword = updateData.debeCambiarPassword;
    }

    await this.usuarioRepository.update(id, updatePayload);

    // Retornar el usuario actualizado con relaciones
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error(`Usuario con ID ${id} no encontrado después de la actualización`);
    }

    return updatedUser;
  }

  async softDelete(id: number): Promise<void> {
    await this.usuarioRepository.update(id, { activo: false });
  }

  async isUsernameTaken(username: string, excludeUserId?: number): Promise<boolean> {
    const queryBuilder = this.usuarioRepository
      .createQueryBuilder('usuario')
      .where('usuario.username = :username', { username });

    if (excludeUserId) {
      queryBuilder.andWhere('usuario.id != :excludeUserId', { excludeUserId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * Mapea el campo de ordenamiento a la ruta correcta en la query
   */
  private getSortField(sortBy: UserSortField): string {
    const sortMap: Record<UserSortField, string> = {
      [UserSortField.ID]: 'usuario.id',
      [UserSortField.USERNAME]: 'usuario.username',
      [UserSortField.FECHA_CREACION]: 'usuario.fechaCreacion',
      [UserSortField.ULTIMO_ACCESO]: 'usuario.ultimoAcceso',
    };

    return sortMap[sortBy] || 'usuario.fechaCreacion';
  }
}

