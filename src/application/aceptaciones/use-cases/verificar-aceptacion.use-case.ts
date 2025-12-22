import {
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { IAceptacionesRepository } from '@/domain/aceptaciones/ports/aceptaciones.repository.port';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@Injectable()
export class VerificarAceptacionUseCase {
  constructor(
    @Inject('IAceptacionesRepository')
    private readonly aceptacionesRepository: IAceptacionesRepository,
  ) {}

  async execute(usuario: Usuario): Promise<void> {
    // Verificar si el usuario ha aceptado todos los documentos legales activos
    const hasAceptadoTodos =
      await this.aceptacionesRepository.hasAceptadoTodosDocumentos(usuario.id);

    if (!hasAceptadoTodos) {
      throw new UnauthorizedException(
        'Debe aceptar los términos y condiciones antes de acceder al sistema',
      );
    }
  }
}

