import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { IUsuariosRepository } from '@/domain/usuarios/ports/usuarios.repository.port';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Rol } from '@/entities/roles/rol.entity';
import { Instructor } from '@/entities/instructores/instructor.entity';
import { UpdateUserDto } from '@/application/usuarios/dto/update-user.dto';
import {
  UserSortField,
  SortOrder,
} from '@/application/usuarios/dto/list-users.dto';

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
    empresaId?: number; // Filtro por empresa (para usuarios CLIENTE)
  }): Promise<{ usuarios: Usuario[]; total: number }> {
    const queryBuilder = this.createUsuarioListQueryBuilder();
    this.applyUsuarioListFilters(queryBuilder, filters);

    const sortField = this.getSortField(filters.sortBy);
    queryBuilder.orderBy(sortField, filters.sortOrder);

    const skip = (filters.page - 1) * filters.limit;
    queryBuilder.skip(skip).take(filters.limit);

    const [usuarios, total] = await queryBuilder.getManyAndCount();

    return { usuarios, total };
  }

  async findAllForExportKeyset(
    filters: {
      search?: string;
      role?: string;
      habilitado?: boolean;
      activo?: boolean;
      empresaId?: number;
    },
    afterUsuarioId: number,
    limit: number,
  ): Promise<Usuario[]> {
    const queryBuilder = this.createUsuarioListQueryBuilder();
    this.applyUsuarioListFilters(queryBuilder, filters);
    queryBuilder
      .andWhere('usuario.id > :afterId', { afterId: afterUsuarioId })
      .orderBy('usuario.id', 'ASC')
      .take(limit);

    return queryBuilder.getMany();
  }

  private createUsuarioListQueryBuilder(): SelectQueryBuilder<Usuario> {
    return this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.persona', 'persona')
      .leftJoinAndSelect('persona.empresa', 'empresa')
      .leftJoinAndSelect('usuario.rolPrincipal', 'rolPrincipal');
  }

  private applyUsuarioListFilters(
    queryBuilder: SelectQueryBuilder<Usuario>,
    filters: {
      search?: string;
      role?: string;
      habilitado?: boolean;
      activo?: boolean;
      empresaId?: number;
    },
  ): void {
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      queryBuilder.andWhere(
        '(usuario.username LIKE :search OR persona.email LIKE :search OR persona.numeroDocumento LIKE :search)',
        { search: searchTerm },
      );
    }

    if (filters.role) {
      queryBuilder.andWhere('rolPrincipal.codigo = :role', {
        role: filters.role,
      });
    }

    if (filters.habilitado !== undefined) {
      queryBuilder.andWhere('usuario.habilitado = :habilitado', {
        habilitado: filters.habilitado,
      });
    }

    if (filters.activo !== undefined) {
      queryBuilder.andWhere('usuario.activo = :activo', {
        activo: filters.activo,
      });
    } else {
      queryBuilder.andWhere('usuario.activo = :activo', { activo: true });
    }

    if (filters.empresaId !== undefined) {
      queryBuilder.andWhere('persona.empresaId = :empresaId', {
        empresaId: filters.empresaId,
      });
    }
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

    let rolAsignado: Rol | null = null;
    if (updateData.rolPrincipalId !== undefined) {
      const rol = await this.usuarioRepository.manager.findOne(Rol, {
        where: { id: updateData.rolPrincipalId },
      });
      if (!rol) {
        throw new Error(
          `Rol con ID ${updateData.rolPrincipalId} no encontrado`,
        );
      }
      updatePayload.rolPrincipal = rol;
      rolAsignado = rol;
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

    // Si se asignó el rol INSTRUCTOR, crear registro en tabla instructores si no existe (firma, Config > Docentes)
    if (rolAsignado?.codigo === 'INSTRUCTOR') {
      const usuario = await this.usuarioRepository.findOne({
        where: { id },
        relations: ['persona'],
      });
      if (usuario?.persona?.id) {
        const instructorRepo =
          this.usuarioRepository.manager.getRepository(Instructor);
        const existe = await instructorRepo.findOne({
          where: { persona: { id: usuario.persona.id } },
        });
        if (!existe) {
          await instructorRepo.save({
            persona: { id: usuario.persona.id },
            activo: true,
          });
        }
      }
    }

    // Actualizar datos de persona si se proporcionan
    const personaUpdateData: any = {};
    if (updateData.nombres !== undefined) {
      personaUpdateData.nombres = updateData.nombres;
    }
    if (updateData.apellidos !== undefined) {
      personaUpdateData.apellidos = updateData.apellidos;
    }
    if (updateData.email !== undefined) {
      personaUpdateData.email = updateData.email;
    }
    if (updateData.telefono !== undefined) {
      personaUpdateData.telefono = updateData.telefono;
    }
    if (updateData.fechaNacimiento !== undefined) {
      personaUpdateData.fechaNacimiento = updateData.fechaNacimiento;
    }
    if (updateData.genero !== undefined) {
      personaUpdateData.genero = updateData.genero;
    }
    if (updateData.direccion !== undefined) {
      personaUpdateData.direccion = updateData.direccion;
    }

    if (updateData.empresaId !== undefined) {
      personaUpdateData.empresaId = updateData.empresaId;
    }

    // Si hay datos de persona para actualizar, obtener el usuario primero para acceder a la persona
    if (Object.keys(personaUpdateData).length > 0) {
      const usuario = await this.findById(id);
      if (!usuario) {
        throw new Error(`Usuario con ID ${id} no encontrado`);
      }
      if (usuario.persona) {
        const { Persona } =
          await import('../../entities/persona/persona.entity');
        await this.usuarioRepository.manager.update(
          Persona,
          usuario.persona.id,
          personaUpdateData,
        );
      }
    }

    // Retornar el usuario actualizado con relaciones
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error(
        `Usuario con ID ${id} no encontrado después de la actualización`,
      );
    }

    return updatedUser;
  }

  async softDelete(id: number): Promise<void> {
    await this.usuarioRepository.update(id, { activo: false });
  }

  async isUsernameTaken(
    username: string,
    excludeUserId?: number,
  ): Promise<boolean> {
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
