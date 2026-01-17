// Caso de uso: Crear configuración de sesión
// Capa de Aplicación (arquitectura hexagonal)

import { Inject, Injectable } from '@nestjs/common';
import type {
  IConfiguracionSesionRepository,
  CreateConfiguracionSesionDto,
} from '@/domain/sesion/ports/configuracion-sesion.repository.port';
import type { ConfiguracionSesion } from '@/entities/sesion/configuracion-sesion.entity';

/**
 * Caso de uso para crear una nueva configuración de sesión
 */
@Injectable()
export class CreateConfiguracionSesionUseCase {
  constructor(
    @Inject('IConfiguracionSesionRepository')
    private readonly repository: IConfiguracionSesionRepository,
  ) {}

  async execute(
    dto: CreateConfiguracionSesionDto,
    creadoPorId: number,
  ): Promise<ConfiguracionSesion> {
    return this.repository.create(dto, creadoPorId);
  }
}
