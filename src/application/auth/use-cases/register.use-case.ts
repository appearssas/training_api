import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { RegisterDto, TipoRegistro } from '@/application/auth/dto/register.dto';
import { Usuario } from '@/entities/usuario.entity';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(registerDto: RegisterDto): Promise<{
    access_token: string;
    token_type: string;
    expires_in: string;
  }> {
    // Verificar que el username no esté en uso
    const existingUser = await this.authRepository.findByUsername(
      registerDto.username,
    );
    if (existingUser) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    // Verificar que el email no esté en uso
    const existingPersonaByEmail = await this.authRepository.findByEmail(
      registerDto.email,
    );
    if (existingPersonaByEmail) {
      throw new ConflictException('El email ya está registrado');
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
      registerDto.tipoRegistro !== TipoRegistro.INSTRUCTOR
    ) {
      throw new BadRequestException(
        'El tipo de registro debe ser ALUMNO o INSTRUCTOR',
      );
    }

    // Hash de la contraseña
    const passwordHash = this.authRepository.hashPassword(registerDto.password);

    // Preparar datos de persona
    const personaData = {
      numeroDocumento: registerDto.numeroDocumento,
      tipoDocumento: registerDto.tipoDocumento || 'CC',
      nombres: registerDto.nombres,
      apellidos: registerDto.apellidos,
      email: registerDto.email,
      telefono: registerDto.telefono,
      fechaNacimiento: registerDto.fechaNacimiento
        ? new Date(registerDto.fechaNacimiento)
        : undefined,
      genero: registerDto.genero,
      direccion: registerDto.direccion,
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

    // Si es ALUMNO, agregar datos específicos
    if (registerDto.tipoRegistro === TipoRegistro.ALUMNO) {
      // Los datos específicos de alumno se manejan en el repositorio
      // Si se necesita codigoEstudiante, se puede pasar aquí
    }

    // Si es INSTRUCTOR, agregar datos específicos
    if (registerDto.tipoRegistro === TipoRegistro.INSTRUCTOR) {
      // Los datos específicos de instructor se manejan en el repositorio
    }

    // Generar token con metadata
    const tokenResult = this.authRepository.generateTokenWithMetadata(usuario);

    return {
      access_token: tokenResult.access_token,
      token_type: 'Bearer',
      expires_in: tokenResult.expires_in,
    };
  }
}
