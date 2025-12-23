import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUsuariosRepository } from '@/domain/usuarios/ports/usuarios.repository.port';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('IUsuariosRepository')
    private readonly usuariosRepository: IUsuariosRepository,
  ) {}

  async execute(id: number): Promise<{ message: string }> {
    // Verificar que el usuario existe
    const existingUser = await this.usuariosRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Verificar que el usuario no esté ya eliminado (soft-delete)
    if (!existingUser.activo) {
      throw new BadRequestException('El usuario ya está eliminado');
    }

    // Realizar soft-delete
    await this.usuariosRepository.softDelete(id);

    return {
      message: `Usuario con ID ${id} eliminado exitosamente (soft-delete)`,
    };
  }
}

