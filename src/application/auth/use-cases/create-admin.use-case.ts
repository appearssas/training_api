import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { CreateAdminDto } from '@/application/auth/dto/create-admin.dto';
import { TipoDocumento } from '@/entities/persona/types';

@Injectable()
export class CreateAdminUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
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

    // Hash de la contraseña
    const passwordHash = this.authRepository.hashPassword(createAdminDto.password);

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
    );

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

