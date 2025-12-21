import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { IPasswordResetRepository } from '@/domain/auth/password-reset.repository.port';
import { PasswordResetToken } from '@/entities/password-reset/password-reset-token.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@Injectable()
export class PasswordResetRepository implements IPasswordResetRepository {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly repository: Repository<PasswordResetToken>,
  ) {}

  async createToken(
    usuario: Usuario,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    const token = this.repository.create({
      usuario,
      tokenHash,
      expiresAt,
      used: false,
    });
    return await this.repository.save(token);
  }

  async findActiveTokensByUserId(
    userId: number,
  ): Promise<PasswordResetToken[]> {
    const now = new Date();
    return await this.repository.find({
      where: {
        usuario: { id: userId },
        used: false,
        expiresAt: LessThan(now) as any,
      },
      relations: ['usuario', 'usuario.persona'],
    });
  }

  async invalidateUserTokens(userId: number): Promise<void> {
    await this.repository.update(
      {
        usuario: { id: userId },
        used: false,
      },
      { used: true },
    );
  }

  async markTokenAsUsed(tokenId: number): Promise<void> {
    await this.repository.update(tokenId, { used: true });
  }
}
