import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IPersonasRepository } from '@/domain/personas/ports/personas.repository.port';
import { IPagosRepository } from '@/domain/pagos/ports/pagos.repository.port';
import { DataSource } from 'typeorm';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@Injectable()
export class HabilitarConductorUseCase {
  constructor(
    @Inject('IPersonasRepository')
    private readonly personasRepository: IPersonasRepository,
    @Inject('IPagosRepository')
    private readonly pagosRepository: IPagosRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(estudianteId: number): Promise<{ message: string }> {
    // Verificar que el estudiante existe
    const estudiante = await this.personasRepository.findById(estudianteId);

    if (!estudiante) {
      throw new NotFoundException(
        `No se encontró el estudiante con ID ${estudianteId}`,
      );
    }

    // Verificar que el estudiante es un conductor externo
    if (!estudiante.alumno || !estudiante.alumno.esExterno) {
      throw new BadRequestException(
        'Solo se pueden habilitar conductores externos',
      );
    }

    // Verificar que existe al menos un pago registrado
    const pagos = await this.pagosRepository.findByEstudianteId(estudianteId);

    if (pagos.length === 0) {
      throw new BadRequestException(
        'No se puede habilitar el conductor sin un pago registrado',
      );
    }

    // Verificar que el usuario existe
    if (!estudiante.usuario) {
      throw new NotFoundException('El conductor no tiene un usuario asociado');
    }

    // Habilitar el conductor
    const usuarioRepository = this.dataSource.getRepository(Usuario);
    estudiante.usuario.habilitado = true;
    await usuarioRepository.save(estudiante.usuario);

    return {
      message: `Conductor ${estudiante.nombres} ${estudiante.apellidos} habilitado exitosamente. Ya puede iniciar sesión y recibir cursos.`,
    };
  }
}
