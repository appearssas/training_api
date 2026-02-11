import { Injectable, Inject } from '@nestjs/common';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';
import { Usuario } from '@/entities/usuarios/usuario.entity';

const ROLES_SOLO_EMPRESA = ['CLIENTE', 'OPERADOR'] as const;

/**
 * Caso de uso: Obtener todas las inscripciones con paginación.
 * Para CLIENTE y OPERADOR solo devuelve inscripciones de estudiantes de su empresa.
 */
@Injectable()
export class FindAllInscripcionesUseCase {
  constructor(
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
  ) {}

  async execute(pagination: PaginationDto, user?: Usuario): Promise<any> {
    const options: { empresaId?: number } = {};
    const rol = user?.rolPrincipal?.codigo;
    if (rol && ROLES_SOLO_EMPRESA.includes(rol as any)) {
      const empresaId = user?.persona?.empresaId ?? user?.persona?.empresa?.id;
      if (empresaId != null) {
        options.empresaId = empresaId;
      }
    }
    return this.inscripcionesRepository.findAll(pagination, options);
  }
}
