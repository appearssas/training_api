// Caso de uso: Actualizar configuración de sesión
// Capa de Aplicación (arquitectura hexagonal)

import { Inject, Injectable } from '@nestjs/common';
import type {
  IConfiguracionSesionRepository,
  UpdateConfiguracionSesionDto,
} from '@/domain/sesion/ports/configuracion-sesion.repository.port';
import type { ConfiguracionSesion } from '@/entities/sesion/configuracion-sesion.entity';

/**
 * Caso de uso para actualizar una configuración de sesión
 */
@Injectable()
export class UpdateConfiguracionSesionUseCase {
  constructor(
    @Inject('IConfiguracionSesionRepository')
    private readonly repository: IConfiguracionSesionRepository,
  ) {}

  async execute(
    id: number,
    dto: UpdateConfiguracionSesionDto,
  ): Promise<ConfiguracionSesion> {
    return this.repository.update(id, dto);
  }
}
