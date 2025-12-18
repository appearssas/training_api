import { Injectable, Inject } from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  execute(user: Usuario): {
    access_token: string;
    token_type: string;
    expires_in: number;
  } {
    const tokenResult = this.authRepository.generateTokenWithMetadata(user);
    return {
      access_token: tokenResult.access_token,
      token_type: 'Bearer',
      expires_in: +tokenResult.expires_in,
    };
  }
}
