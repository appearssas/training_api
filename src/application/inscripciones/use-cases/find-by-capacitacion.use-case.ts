import { Injectable, Inject } from '@nestjs/common';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';
import { Usuario } from '@/entities/usuarios/usuario.entity';

const ROLES_SOLO_EMPRESA = ['CLIENTE', 'OPERADOR'] as const;

/**
 * Caso de uso: Obtener todas las inscripciones de una capacitación específica.
 * Para CLIENTE y OPERADOR solo devuelve inscripciones de estudiantes de su empresa.
 */
@Injectable()
export class FindByCapacitacionUseCase {
  constructor(
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
  ) {}

  async execute(
    capacitacionId: number,
    pagination?: PaginationDto,
    user?: Usuario,
  ): Promise<any> {
    const options: { empresaId?: number } = {};
    const rol = user?.rolPrincipal?.codigo;
    if (
      rol &&
      ROLES_SOLO_EMPRESA.includes(rol as (typeof ROLES_SOLO_EMPRESA)[number])
    ) {
      const empresaId = user?.persona?.empresaId ?? user?.persona?.empresa?.id;
      if (empresaId != null) {
        options.empresaId = empresaId;
      }
    }
    return this.inscripcionesRepository.findByCapacitacion(
      capacitacionId,
      pagination || { page: 1, limit: 10 },
      options,
    );
  }
}
