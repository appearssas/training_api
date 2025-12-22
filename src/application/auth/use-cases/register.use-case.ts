import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { RegisterDto, TipoRegistro } from '@/application/auth/dto/register.dto';
import { TipoDocumento } from '@/entities/persona/types';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(registerDto: RegisterDto): Promise<{
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
        throw new ConflictException('El número de documento ya está registrado');
      }

      // Validar que el tipo de registro sea válido
      if (
        registerDto.tipoRegistro !== TipoRegistro.ALUMNO &&
        registerDto.tipoRegistro !== TipoRegistro.INSTRUCTOR &&
        registerDto.tipoRegistro !== TipoRegistro.OPERADOR
      ) {
        throw new BadRequestException(
          'El tipo de registro debe ser ALUMNO, INSTRUCTOR u OPERADOR',
        );
      }

      // Hash de la contraseña
      const passwordHash = this.authRepository.hashPassword(registerDto.password);

      // Determinar tipo de persona basado en si tiene razón social o no
      const tipoPersona = registerDto.tipoPersona || (registerDto.razonSocial ? 'JURIDICA' : 'NATURAL');

      // Validar que si es JURIDICA, tenga razón social
      if (tipoPersona === 'JURIDICA' && !registerDto.razonSocial) {
        throw new BadRequestException(
          'La razón social es obligatoria para personas jurídicas',
        );
      }

      // Preparar datos de persona
      const personaData = {
        numeroDocumento: registerDto.numeroDocumento,
        tipoDocumento: registerDto.tipoDocumento || 'CC',
        tipoPersona: tipoPersona as 'NATURAL' | 'JURIDICA',
        nombres: registerDto.nombres,
        apellidos: registerDto.apellidos || '',
        razonSocial: registerDto.razonSocial,
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
      );

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
