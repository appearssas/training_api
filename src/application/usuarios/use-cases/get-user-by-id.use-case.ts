import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUsuariosRepository } from '@/domain/usuarios/ports/usuarios.repository.port';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject('IUsuariosRepository')
    private readonly usuariosRepository: IUsuariosRepository,
  ) {}

  async execute(id: number): Promise<UserResponseDto> {
    const usuario = await this.usuariosRepository.findById(id);

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return {
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
    };
  }
}
