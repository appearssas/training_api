import { Injectable, Inject, ConflictException, Logger } from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { CreateAdminDto } from '@/application/auth/dto/create-admin.dto';
import { TipoDocumento } from '@/entities/persona/types';
import { EmailService } from '@/infrastructure/email/email.service';
import { AceptarTerminosUseCase } from '@/application/aceptaciones/use-cases/aceptar-terminos.use-case';
import { ObtenerDocumentosActivosUseCase } from '@/application/aceptaciones/use-cases/obtener-documentos-activos.use-case';

@Injectable()
export class CreateAdminUseCase {
  private readonly logger = new Logger(CreateAdminUseCase.name);

  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly emailService: EmailService,
    private readonly aceptarTerminosUseCase: AceptarTerminosUseCase,
    private readonly obtenerDocumentosActivosUseCase: ObtenerDocumentosActivosUseCase,
  ) {}

  async execute(createAdminDto: CreateAdminDto): Promise<{
    id: number;
    username: string;
    email: string;
    nombres: string;
    apellidos: string;
    rol: string;
  }> {
    // Verificar que el username no esté en uso
    const existingUser = await this.authRepository.findByUsername(
      createAdminDto.username,
    );
    if (existingUser) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    // Verificar que el email no esté en uso
    const existingPersonaByEmail = await this.authRepository.findByEmail(
      createAdminDto.email,
    );
    if (existingPersonaByEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    // Verificar que el número de documento no esté en uso
    const existingPersonaByDoc =
      await this.authRepository.findByNumeroDocumento(
        createAdminDto.numeroDocumento,
      );
    if (existingPersonaByDoc) {
      throw new ConflictException('El número de documento ya está registrado');
    }

    // Guardar la contraseña temporal antes de hashearla para enviarla por email
    const passwordTemporal = createAdminDto.password;

    // Hash de la contraseña
    const passwordHash = this.authRepository.hashPassword(
      createAdminDto.password,
    );

    // Preparar datos de persona
    const personaData = {
      numeroDocumento: createAdminDto.numeroDocumento,
      tipoDocumento: createAdminDto.tipoDocumento || TipoDocumento.CC,
      nombres: createAdminDto.nombres,
      apellidos: createAdminDto.apellidos,
      email: createAdminDto.email,
      telefono: createAdminDto.telefono,
      fechaNacimiento: createAdminDto.fechaNacimiento
        ? new Date(createAdminDto.fechaNacimiento)
        : undefined,
      genero: createAdminDto.genero,
      direccion: createAdminDto.direccion,
      activo: true,
    };

    // Crear persona y usuario con rol ADMIN
    const usuario = await this.authRepository.createPersonaWithUsuario(
      personaData,
      {
        username: createAdminDto.username,
        passwordHash,
      },
      'ADMIN', // Rol de administrador
      createAdminDto.habilitado ?? true, // Por defecto true para administradores
    );

    // Si el administrador aceptó los términos y políticas, aceptarlos automáticamente
    // Si no se enviaron explícitamente, aceptarlos por defecto cuando se crea desde el panel de admin
    const debeAceptarTerminos =
      createAdminDto.aceptaTerminos !== false &&
      createAdminDto.aceptaPoliticaDatos !== false;

    if (debeAceptarTerminos) {
      try {
        // Obtener todos los documentos legales activos
        const documentosActivos =
          await this.obtenerDocumentosActivosUseCase.execute();

        if (documentosActivos.length > 0) {
          // Obtener los IDs de los documentos activos
          const documentosIds = documentosActivos.map(doc => doc.id);

          // Aceptar todos los documentos activos
          await this.aceptarTerminosUseCase.execute(
            { documentosIds },
            usuario,
            undefined, // IP address no disponible
            undefined, // User agent no disponible
          );

          this.logger.log(
            `✅ Términos y políticas aceptados automáticamente para administrador ${createAdminDto.username}`,
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `⚠️ Error al aceptar términos durante la creación del administrador: ${message}`,
        );
        // Continuar con la creación aunque falle la aceptación de términos
      }
    }

    // Enviar email con credenciales temporales
    if (createAdminDto.email) {
      try {
        const nombreCompleto =
          `${createAdminDto.nombres} ${createAdminDto.apellidos}`.trim();

        await this.emailService.enviarCredencialesTemporales(
          createAdminDto.email,
          nombreCompleto,
          createAdminDto.username,
          passwordTemporal,
        );

        this.logger.log(
          `✅ Email con credenciales enviado a ${createAdminDto.email} para administrador ${createAdminDto.username}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `⚠️ Error al enviar email de credenciales a ${createAdminDto.email}: ${message}`,
        );
        this.logger.warn(
          'El administrador fue creado exitosamente, pero no se pudo enviar el email con las credenciales.',
        );
      }
    } else {
      this.logger.warn(
        `⚠️ Administrador ${createAdminDto.username} creado sin email, no se enviaron credenciales por correo.`,
      );
    }

    return {
      id: usuario.id,
      username: usuario.username,
      email: usuario.persona?.email || '',
      nombres: usuario.persona?.nombres || '',
      apellidos: usuario.persona?.apellidos || '',
      rol: usuario.rolPrincipal?.codigo || 'ADMIN',
    };
  }
}
