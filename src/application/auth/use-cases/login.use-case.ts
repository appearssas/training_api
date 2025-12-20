import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { LoginDto } from '@/application/auth/dto/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(loginDto: LoginDto): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const user = await this.authRepository.findByUsername(loginDto.username);

    if (!user) {
      throw new UnauthorizedException('Usuario o contraseña inválidos');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Datos de usuario inválidos');
    }

    // Verificar que el usuario esté activo
    if (!user.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Verificar que el usuario esté habilitado (aprobado por admin)
    if (!user.habilitado) {
      throw new UnauthorizedException(
        'Tu cuenta está pendiente de aprobación del administrador',
      );
    }

    // Verificar que la persona esté activa
    if (user.persona && !user.persona.activo) {
      throw new UnauthorizedException('Persona inactiva');
    }

    const isPasswordMatch = this.authRepository.comparePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokenResult = this.authRepository.generateTokenWithMetadata(user);

    return {
      access_token: tokenResult.access_token,
      token_type: 'Bearer',
      expires_in: +tokenResult.expires_in,
    };
  }
}
