import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcryptjs');
import { ConfigService } from '@nestjs/config';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Persona } from '@/entities/persona/persona.entity';
import { RequestPasswordResetDto } from '../dto/request-password-reset.dto';
import { EmailService } from '@/infrastructure/email/email.service';
import { IPasswordResetRepository } from '@/domain/auth/password-reset.repository.port';

export interface RequestPasswordResetResponse {
  success: boolean;
  message: string;
  emailSentTo?: string;
}

@Injectable()
export class RequestPasswordResetUseCase {
  private readonly logger = new Logger(RequestPasswordResetUseCase.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @Inject('IPasswordResetRepository')
    private readonly passwordResetRepository: IPasswordResetRepository,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    dto: RequestPasswordResetDto,
  ): Promise<RequestPasswordResetResponse> {
    const { usernameOrEmail } = dto;

    // Buscar usuario por username o email
    const usuario = await this.usuarioRepository.findOne({
      where: [
        { username: usernameOrEmail },
        { persona: { email: usernameOrEmail } },
      ],
      relations: ['persona'],
    });

    // IMPORTANTE: Siempre retornar mensaje genérico para prevenir enumeración de usuarios
    const genericMessage =
      'Si el usuario existe, se ha enviado un correo con instrucciones para recuperar la contraseña';

    if (!usuario || !usuario.persona?.email) {
      this.logger.warn(
        `Intento de recuperación para usuario inexistente: ${usernameOrEmail}`,
      );
      return {
        success: true,
        message: genericMessage,
      };
    }

    // Invalidar tokens previos del usuario
    await this.passwordResetRepository.invalidateUserTokens(usuario.id);

    // Generar token aleatorio seguro (32 bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hashear token antes de guardar en BD
    const tokenHash = await bcrypt.hash(resetToken, 10);

    // Calcular fecha de expiración (1 hora por defecto)
    const expiryMinutes =
      this.configService.get<number>('PASSWORD_RESET_TOKEN_EXPIRY') || 3600;
    const expiresAt = new Date(Date.now() + expiryMinutes * 1000);

    // Guardar token en BD
    await this.passwordResetRepository.createToken(
      usuario,
      tokenHash,
      expiresAt,
    );

    // Enviar email con token en plaintext (solo una vez)
    try {
      await this.emailService.sendPasswordResetEmail(
        usuario.persona.email,
        resetToken,
        usuario.username,
      );
    } catch (error) {
      this.logger.error(`Error al enviar email de recuperación:`, error);
      throw new BadRequestException(
        'No se pudo enviar el correo de recuperación. Por favor, intenta más tarde.',
      );
    }

    // Censurar email para mostrar al usuario
    const censoredEmail = this.censorEmail(usuario.persona.email);

    this.logger.log(`Token de recuperación creado para usuario: ${usuario.id}`);

    return {
      success: true,
      message: genericMessage,
      emailSentTo: censoredEmail,
    };
  }

  private censorEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (!username || !domain) return '***@***';

    const censoredUsername =
      username.length > 2
        ? `${username[0]}***${username[username.length - 1]}`
        : '***';

    const [domainName, tld] = domain.split('.');
    const censoredDomain =
      domainName && domainName.length > 2
        ? `${domainName[0]}***`
        : '***';

    return `${censoredUsername}@${censoredDomain}.${tld || 'com'}`;
  }
}
