import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { RegisterDto, TipoRegistro } from '@/application/auth/dto/register.dto';
import { AceptarTerminosUseCase } from '@/application/aceptaciones/use-cases/aceptar-terminos.use-case';
import { ObtenerDocumentosActivosUseCase } from '@/application/aceptaciones/use-cases/obtener-documentos-activos.use-case';
import { EmailService } from '@/infrastructure/email/email.service';

@Injectable()
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly aceptarTerminosUseCase: AceptarTerminosUseCase,
    private readonly obtenerDocumentosActivosUseCase: ObtenerDocumentosActivosUseCase,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    registerDto: RegisterDto,
    currentUser?: {
      id: number;
      rolPrincipal?: { codigo: string };
      persona?: { empresaId?: number };
    },
  ): Promise<{
    message: string;
  }> {
    try {
      // Verificar que el username no esté en uso
      const existingUser = await this.authRepository.findByUsername(
        registerDto.username,
      );
      if (existingUser) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }

      // Verificar que el email no esté en uso
      if (registerDto.email) {
        const existingPersonaByEmail = await this.authRepository.findByEmail(
          registerDto.email,
        );
        if (existingPersonaByEmail) {
          throw new ConflictException('El email ya está registrado');
        }
      }

      // Verificar que el número de documento no esté en uso
      const existingPersonaByDoc =
        await this.authRepository.findByNumeroDocumento(
          registerDto.numeroDocumento,
        );
      if (existingPersonaByDoc) {
        throw new ConflictException(
          'El número de documento ya está registrado',
        );
      }

      // Validar que el tipo de registro sea válido
      if (
        registerDto.tipoRegistro !== TipoRegistro.ALUMNO &&
        registerDto.tipoRegistro !== TipoRegistro.INSTRUCTOR &&
        registerDto.tipoRegistro !== TipoRegistro.OPERADOR &&
        registerDto.tipoRegistro !== TipoRegistro.CLIENTE
      ) {
        throw new BadRequestException(
          'El tipo de registro debe ser ALUMNO, INSTRUCTOR, OPERADOR o CLIENTE',
        );
      }

      // Guardar la contraseña temporal antes de hashearla para enviarla por email
      const passwordTemporal = registerDto.password;

      // Hash de la contraseña
      const passwordHash = this.authRepository.hashPassword(
        registerDto.password,
      );

      // Determinar tipo de persona basado en si tiene razón social o no
      const tipoPersona: 'NATURAL' | 'JURIDICA' =
        registerDto.tipoPersona ||
        (registerDto.razonSocial ? 'JURIDICA' : 'NATURAL');

      // Validar que si es JURIDICA, tenga razón social
      if (tipoPersona === 'JURIDICA' && !registerDto.razonSocial) {
        throw new BadRequestException(
          'La razón social es obligatoria para personas jurídicas',
        );
      }

      // Determinar empresaId: si el usuario actual es CLIENTE y no se proporciona empresaId, usar su empresa
      let empresaId = registerDto.empresaId;
      if (
        !empresaId &&
        currentUser?.rolPrincipal?.codigo === 'CLIENTE' &&
        currentUser?.persona?.empresaId
      ) {
        empresaId = currentUser.persona.empresaId;
        this.logger.log(
          `Usuario CLIENTE creando usuario, asignando automáticamente empresaId: ${empresaId}`,
        );
      }

      // Preparar datos de persona
      // NOTA: razonSocial ya no se almacena en Persona, se maneja mediante la relación con Empresa
      const personaData = {
        numeroDocumento: registerDto.numeroDocumento,
        tipoDocumento: registerDto.tipoDocumento || 'CC',
        tipoPersona,
        nombres: registerDto.nombres,
        apellidos: registerDto.apellidos || '',
        email: registerDto.email,
        telefono: registerDto.telefono,
        fechaNacimiento: registerDto.fechaNacimiento
          ? new Date(registerDto.fechaNacimiento)
          : undefined,
        genero: registerDto.genero as any, // Cast para evitar conflictos de enum si hay diferencias de versión
        direccion: registerDto.direccion,
        fotoUrl: registerDto.fotoUrl,
        activo: true,
      };

      // Crear persona, usuario y asignar rol
      const usuario = await this.authRepository.createPersonaWithUsuario(
        personaData,
        {
          username: registerDto.username,
          passwordHash,
        },
        registerDto.tipoRegistro,
        registerDto.habilitado ?? false, // Por defecto false, pero puede venir del frontend
        empresaId, // Asociar a empresa (puede venir del DTO o ser automático para CLIENTE)
      );

      // Si el usuario aceptó los términos y políticas, aceptarlos automáticamente
      if (registerDto.aceptaTerminos && registerDto.aceptaPoliticaDatos) {
        try {
          // Obtener todos los documentos legales activos
          const documentosActivos =
            await this.obtenerDocumentosActivosUseCase.execute();

          if (documentosActivos.length > 0) {
            // Obtener los IDs de los documentos activos
            const documentosIds = documentosActivos.map((doc) => doc.id);

            // Aceptar todos los documentos activos
            await this.aceptarTerminosUseCase.execute(
              { documentosIds },
              usuario,
              undefined, // IP address no disponible en el registro
              undefined, // User agent no disponible en el registro
            );
          }
        } catch (error) {
          // Si hay un error al aceptar términos, loguearlo pero no fallar el registro
          console.error(
            'Error al aceptar términos durante el registro:',
            error,
          );
          // Continuar con el registro aunque falle la aceptación de términos
        }
      }

      // Enviar email con credenciales temporales
      if (registerDto.email) {
        try {
          const nombreCompleto =
            registerDto.razonSocial ||
            `${registerDto.nombres} ${registerDto.apellidos || ''}`.trim();

          await this.emailService.enviarCredencialesTemporales(
            registerDto.email,
            nombreCompleto,
            registerDto.username,
            passwordTemporal,
          );

          this.logger.log(
            `✅ Email con credenciales enviado a ${registerDto.email} para usuario ${registerDto.username}`,
          );
        } catch (error) {
          // No fallar el registro si falla el envío de email, solo loguearlo
          this.logger.error(
            `⚠️ Error al enviar email de credenciales a ${registerDto.email}: ${error.message}`,
          );
          this.logger.warn(
            'El usuario fue creado exitosamente, pero no se pudo enviar el email con las credenciales.',
          );
        }
      } else {
        this.logger.warn(
          `⚠️ Usuario ${registerDto.username} creado sin email, no se enviaron credenciales por correo.`,
        );
      }

      // NO generar token automáticamente
      // Retornar mensaje de éxito
      return {
        message: 'Registro exitoso. Espere aprobación del administrador.',
      };
    } catch (error) {
      console.error('Error en RegisterUseCase:', error);
      throw error;
    }
  }
}
