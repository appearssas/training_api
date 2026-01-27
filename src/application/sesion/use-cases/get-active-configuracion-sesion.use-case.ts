// Caso de uso: Obtener configuración activa de sesión
// Capa de Aplicación (arquitectura hexagonal)

import { Inject, Injectable } from '@nestjs/common';
import type { IConfiguracionSesionRepository } from '@/domain/sesion/ports/configuracion-sesion.repository.port';
import type { ConfiguracionSesion } from '@/entities/sesion/configuracion-sesion.entity';

/**
 * Caso de uso para obtener la configuración activa de sesión
 */
@Injectable()
export class GetActiveConfiguracionSesionUseCase {
  constructor(
    @Inject('IConfiguracionSesionRepository')
    private readonly repository: IConfiguracionSesionRepository,
  ) {}

  async execute(): Promise<ConfiguracionSesion | null> {
    return this.repository.findActive();
  }
}
