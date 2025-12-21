import { Usuario } from '@/entities/usuarios/usuario.entity';
import { PasswordResetToken } from '@/entities/password-reset/password-reset-token.entity';

export interface IPasswordResetRepository {
  createToken(
    usuario: Usuario,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken>;

  findActiveTokensByUserId(userId: number): Promise<PasswordResetToken[]>;

  invalidateUserTokens(userId: number): Promise<void>;

  markTokenAsUsed(tokenId: number): Promise<void>;
}
