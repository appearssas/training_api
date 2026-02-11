import { Injectable, Inject } from '@nestjs/common';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';
import { Usuario } from '@/entities/usuarios/usuario.entity';

const ROLES_SOLO_EMPRESA = ['CLIENTE', 'OPERADOR'] as const;

/**
 * Para CLIENTE y OPERADOR solo devuelve capacitaciones asignadas a su empresa por el admin (cursos que pueden asignar a sus usuarios).
 */
@Injectable()
export class FindAllCapacitacionesUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
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
    return this.capacitacionesRepository.findAll(pagination, options);
  }
}
