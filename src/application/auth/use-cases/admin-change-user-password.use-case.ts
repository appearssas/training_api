import {
  Injectable,
  Inject,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { AdminChangeUserPasswordDto } from '../dto/admin-change-user-password.dto';
import { validarPasswordSegura } from '@/infrastructure/shared/helpers/password-generator.helper';

@Injectable()
export class AdminChangeUserPasswordUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(
    adminUser: Usuario,
    userId: number,
    dto: AdminChangeUserPasswordDto,
  ): Promise<{ message: string }> {
    const rolCodigo = adminUser.rolPrincipal?.codigo;
    if (rolCodigo !== 'ADMIN') {
      throw new ForbiddenException(
        'Solo un administrador puede cambiar la contraseña de otro usuario',
      );
    }

    // Cargar admin con passwordHash por si el usuario del JWT no lo trae
    const admin = await this.authRepository.findByUsername(adminUser.username);
    if (!admin?.passwordHash) {
      throw new UnauthorizedException('Usuario administrador no encontrado');
    }

    const isAdminPasswordValid = this.authRepository.comparePassword(
      dto.adminPassword,
      admin.passwordHash,
    );
    if (!isAdminPasswordValid) {
      throw new UnauthorizedException(
        'Contraseña de administrador incorrecta. Verifique e intente de nuevo.',
      );
    }

    const targetUser = await this.authRepository.findUsuarioById(userId);
    if (!targetUser) {
      throw new NotFoundException('Usuario a modificar no encontrado');
    }

    if (!validarPasswordSegura(dto.newPassword)) {
      throw new BadRequestException(
        'La nueva contraseña no cumple con los requisitos. Debe tener al menos 8 caracteres, mayúsculas, minúsculas, números y símbolos (!@#$%&*)',
      );
    }

    const isSamePassword = this.authRepository.comparePassword(
      dto.newPassword,
      targetUser.passwordHash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la contraseña actual del usuario',
      );
    }

    await this.authRepository.updatePassword(targetUser.id, dto.newPassword);

    return {
      message:
        'Contraseña del usuario actualizada correctamente por el administrador.',
    };
  }
}
