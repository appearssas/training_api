import { Injectable, Inject } from '@nestjs/common';
import { IRolesRepository } from '@/domain/roles/ports/roles.repository.port';
import {
  RoleResponseDto,
  ListRolesResponseDto,
} from '../dto/role-response.dto';

@Injectable()
export class GetRolesUseCase {
  constructor(
    @Inject('IRolesRepository')
    private readonly rolesRepository: IRolesRepository,
  ) {}

  async execute(): Promise<ListRolesResponseDto> {
    const roles = await this.rolesRepository.findAll();

    const data: RoleResponseDto[] = roles.map(rol => ({
      id: rol.id,
      nombre: rol.nombre,
      codigo: rol.codigo,
      descripcion: rol.descripcion || undefined,
      activo: Boolean(rol.activo),
      fechaCreacion: rol.fechaCreacion,
    }));

    return {
      data,
    };
  }
}
