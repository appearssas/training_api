import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { UpdateProfileDto } from '@/application/auth/dto/update-profile.dto';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Persona } from '@/entities/persona/persona.entity';
import { Genero } from '@/entities/persona/types';
import { sanitizePersonaData } from '@/infrastructure/shared/helpers/persona-sanitizer.helper';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(user: Usuario, updateDto: UpdateProfileDto) {
    const fullUser = await this.authRepository.findByUsername(user.username);
    if (!fullUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // --- Lógica para cambio de contraseña ---
    if (updateDto.newPassword && updateDto.currentPassword) {
      const isPasswordMatch = this.authRepository.comparePassword(
        updateDto.currentPassword,
        fullUser.passwordHash,
      );

      if (!isPasswordMatch) {
        throw new UnauthorizedException('La contraseña actual es incorrecta');
      }

      fullUser.passwordHash = this.authRepository.hashPassword(updateDto.newPassword);
    }
    
    // --- Lógica para actualizar datos de persona ---
    if (fullUser.persona) {
      if (updateDto.email && updateDto.email !== fullUser.persona.email) {
        const existingPersona = await this.authRepository.findByEmail(updateDto.email);
        if (existingPersona && existingPersona.id !== fullUser.persona.id) {
          throw new ConflictException('El email ya está en uso');
        }
      }
      
      const personaDataToUpdate: Partial<Persona> = {
        nombres: updateDto.nombres,
        apellidos: updateDto.apellidos,
        email: updateDto.email,
        telefono: updateDto.telefono,
        fechaNacimiento: updateDto.fechaNacimiento
          ? new Date(updateDto.fechaNacimiento)
          : undefined,
        genero: updateDto.genero as Genero,
        direccion: updateDto.direccion,
        fotoUrl: updateDto.fotoUrl,
        biografia: updateDto.biografia,
      };

      Object.keys(personaDataToUpdate).forEach(
        (key) => personaDataToUpdate[key] === undefined && delete personaDataToUpdate[key],
      );

      if (Object.keys(personaDataToUpdate).length > 0) {
        // Sanitizar datos personales antes de actualizar
        const sanitizedData = sanitizePersonaData(personaDataToUpdate);
        Object.assign(fullUser.persona, sanitizedData);
      }
    }
    
    await this.authRepository.saveUser(fullUser);

    return {
      message: 'Perfil actualizado exitosamente',
    };
  }
}

