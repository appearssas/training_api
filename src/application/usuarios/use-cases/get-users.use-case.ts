import { Injectable, Inject } from '@nestjs/common';
import { IUsuariosRepository } from '@/domain/usuarios/ports/usuarios.repository.port';
import { ListUsersDto, UserSortField, SortOrder } from '../dto/list-users.dto';
import {
  UserResponseDto,
  ListUsersResponseDto,
} from '../dto/user-response.dto';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@Injectable()
export class GetUsersUseCase {
  constructor(
    @Inject('IUsuariosRepository')
    private readonly usuariosRepository: IUsuariosRepository,
  ) {}

  async execute(
    listUsersDto: ListUsersDto,
    currentUser?: Usuario,
  ): Promise<ListUsersResponseDto> {
    const page = listUsersDto.page || 1;
    const limit = listUsersDto.limit || 10;

    // Si el usuario actual es CLIENTE, solo mostrar usuarios de su empresa
    let empresaId: number | undefined;
    if (
      currentUser?.rolPrincipal?.codigo === 'CLIENTE' &&
      currentUser?.persona?.empresaId
    ) {
      empresaId = currentUser.persona.empresaId;
    }

    const { usuarios, total } = await this.usuariosRepository.findAll({
      page,
      limit,
      search: listUsersDto.search,
      role: listUsersDto.role,
      habilitado: listUsersDto.habilitado,
      activo: listUsersDto.activo,
      sortBy: listUsersDto.sortBy || UserSortField.FECHA_CREACION,
      sortOrder: listUsersDto.sortOrder || SortOrder.DESC,
      empresaId, // Filtrar por empresa si el usuario es CLIENTE
    });

    const totalPages = Math.ceil(total / limit);

    const data: UserResponseDto[] = usuarios.map((usuario) => ({
      id: usuario.id,
      persona: {
        id: usuario.persona.id,
        numeroDocumento: usuario.persona.numeroDocumento,
        tipoDocumento: usuario.persona.tipoDocumento,
        nombres: usuario.persona.nombres,
        apellidos: usuario.persona.apellidos,
        email: usuario.persona.email,
        telefono: usuario.persona.telefono,
        fechaNacimiento: usuario.persona.fechaNacimiento,
        genero: usuario.persona.genero,
        direccion: usuario.persona.direccion,
        activo: usuario.persona.activo,
        fechaCreacion: usuario.persona.fechaCreacion,
        fechaActualizacion: usuario.persona.fechaActualizacion,
      },
      username: usuario.username,
      rolPrincipal: usuario.rolPrincipal
        ? {
            id: usuario.rolPrincipal.id,
            codigo: usuario.rolPrincipal.codigo,
            nombre: usuario.rolPrincipal.nombre,
            activo: usuario.rolPrincipal.activo,
          }
        : undefined,
      habilitado: Boolean(usuario.habilitado),
      activo: Boolean(usuario.activo),
      debeCambiarPassword: Boolean(usuario.debeCambiarPassword),
      ultimoAcceso: usuario.ultimoAcceso,
      fechaCreacion: usuario.fechaCreacion,
      fechaActualizacion: usuario.fechaActualizacion,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

