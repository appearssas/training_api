import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { IUsuariosRepository } from '@/domain/usuarios/ports/usuarios.repository.port';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('IUsuariosRepository')
    private readonly usuariosRepository: IUsuariosRepository,
  ) {}

  async execute(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Verificar que el usuario existe
    const existingUser = await this.usuariosRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Validar que hay al menos un campo para actualizar
    const hasUpdates = Object.keys(updateUserDto).length > 0;
    if (!hasUpdates) {
      throw new BadRequestException('Debe proporcionar al menos un campo para actualizar');
    }

    // Verificar si el username está disponible (si se está actualizando)
    if (updateUserDto.username) {
      const isUsernameTaken = await this.usuariosRepository.isUsernameTaken(
        updateUserDto.username,
        id,
      );
      if (isUsernameTaken) {
        throw new ConflictException(
          `El nombre de usuario "${updateUserDto.username}" ya está en uso`,
        );
      }
    }

    // Actualizar el usuario
    const updatedUser = await this.usuariosRepository.update(id, updateUserDto);

    return {
      id: updatedUser.id,
      persona: {
        id: updatedUser.persona.id,
        numeroDocumento: updatedUser.persona.numeroDocumento,
        tipoDocumento: updatedUser.persona.tipoDocumento,
        nombres: updatedUser.persona.nombres,
        apellidos: updatedUser.persona.apellidos,
        email: updatedUser.persona.email,
        telefono: updatedUser.persona.telefono,
        fechaNacimiento: updatedUser.persona.fechaNacimiento,
        genero: updatedUser.persona.genero,
        direccion: updatedUser.persona.direccion,
        activo: updatedUser.persona.activo,
        fechaCreacion: updatedUser.persona.fechaCreacion,
        fechaActualizacion: updatedUser.persona.fechaActualizacion,
      },
      username: updatedUser.username,
      rolPrincipal: updatedUser.rolPrincipal
        ? {
            id: updatedUser.rolPrincipal.id,
            codigo: updatedUser.rolPrincipal.codigo,
            nombre: updatedUser.rolPrincipal.nombre,
            activo: updatedUser.rolPrincipal.activo,
          }
        : undefined,
      habilitado: Boolean(updatedUser.habilitado),
      activo: Boolean(updatedUser.activo),
      debeCambiarPassword: Boolean(updatedUser.debeCambiarPassword),
      ultimoAcceso: updatedUser.ultimoAcceso,
      fechaCreacion: updatedUser.fechaCreacion,
      fechaActualizacion: updatedUser.fechaActualizacion,
    };
  }
}

