import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { PasswordResetToken } from '@/entities/password-reset/password-reset-token.entity';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { EmailService } from '@/infrastructure/email/email.service';
import { IPasswordResetRepository } from '@/domain/auth/password-reset.repository.port';

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

@Injectable()
export class ResetPasswordUseCase {
  private readonly logger = new Logger(ResetPasswordUseCase.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @Inject('IPasswordResetRepository')
    private readonly passwordResetRepository: IPasswordResetRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
    const { token, newPassword, confirmPassword } = dto;

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // Buscar todos los tokens activos (no usados y no expirados)
    const now = new Date();

    // Buscar el token correcto comparando hashes
    let validToken: PasswordResetToken | null = null;
    let usuario: Usuario | null = null;

    // Esta es una forma temporal - idealmente deberíamos tener un índice
    // Para producción, considera agregar un índice en la tabla
    const tokenRepository = this.getTokenRepository();
    const allActiveTokens = await tokenRepository.find({
      where: {
        used: false,
        expiresAt: MoreThan(now),
      },
      relations: ['usuario', 'usuario.persona'],
    });

    for (const dbToken of allActiveTokens) {
      const isMatch = await bcrypt.compare(token, dbToken.tokenHash);
      if (isMatch) {
        validToken = dbToken;
        usuario = dbToken.usuario;
        break;
      }
    }

    if (!validToken || !usuario) {
      throw new BadRequestException(
        'El token de recuperación es inválido o ha expirado',
      );
    }

    // Marcar token como usado
    await this.passwordResetRepository.markTokenAsUsed(validToken.id);

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await this.usuarioRepository.update(usuario.id, { passwordHash });

    // Enviar email de confirmación
    if (usuario.persona?.email) {
      try {
        await this.emailService.sendPasswordChangedNotification(
          usuario.persona.email,
          usuario.username,
        );
      } catch (error) {
        // Log error pero no fallar (la contraseña ya se cambió)
        this.logger.error(`Error al enviar email de confirmación:`, error);
      }
    }

    this.logger.log(`Contraseña restablecida para usuario: ${usuario.id}`);

    return {
      success: true,
      message: 'Contraseña restablecida exitosamente',
    };
  }

  // Helper para obtener el repositorio (necesario por limitación de diseño)
  private getTokenRepository() {
    // Este es un workaround temporal
    // En una implementación más robusta, inyectarías el Repository directamente
    const { repository } = this.passwordResetRepository as any as {
      repository: Repository<any>;
    };
    return repository;
  }
}
