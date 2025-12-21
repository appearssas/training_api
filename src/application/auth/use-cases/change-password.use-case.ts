import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { validarPasswordSegura } from '@/infrastructure/shared/helpers/password-generator.helper';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(
    username: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Buscar usuario
    const user = await this.authRepository.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar que el usuario debe cambiar la contraseña
    const debeCambiarPassword =
      user.debeCambiarPassword === true ||
      Number(user.debeCambiarPassword) === 1;

    if (!debeCambiarPassword) {
      throw new BadRequestException(
        'Este usuario no requiere cambio de contraseña',
      );
    }

    // Verificar que la contraseña temporal sea correcta
    const isPasswordMatch = this.authRepository.comparePassword(
      changePasswordDto.passwordTemporal,
      user.passwordHash,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Contraseña temporal incorrecta');
    }

    // Validar que la nueva contraseña sea segura
    if (!validarPasswordSegura(changePasswordDto.nuevaPassword)) {
      throw new BadRequestException(
        'La nueva contraseña no cumple con los requisitos de seguridad. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos (!@#$%&*)',
      );
    }

    // Verificar que la nueva contraseña sea diferente a la temporal
    const isSamePassword = this.authRepository.comparePassword(
      changePasswordDto.nuevaPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la contraseña temporal',
      );
    }

    // Cambiar la contraseña
    await this.authRepository.updatePassword(
      user.id,
      changePasswordDto.nuevaPassword,
    );

    return {
      message: 'Contraseña cambiada exitosamente. Ya puede iniciar sesión con su nueva contraseña.',
    };
  }
}

