import { ConfiguracionSesion } from '@/entities/sesion/configuracion-sesion.entity';

export interface CreateConfiguracionSesionDto {
  tiempoInactividadMinutos?: number | null;
  tiempoMaximoSesionMinutos?: number | null;
  activo?: boolean;
}

export interface UpdateConfiguracionSesionDto {
  tiempoInactividadMinutos?: number | null;
  tiempoMaximoSesionMinutos?: number | null;
  activo?: boolean;
}

export interface IConfiguracionSesionRepository {
  /**
   * Obtiene la configuración activa de sesión
   */
  findActive(): Promise<ConfiguracionSesion | null>;

  /**
   * Obtiene todas las configuraciones de sesión
   */
  findAll(): Promise<ConfiguracionSesion[]>;

  /**
   * Obtiene una configuración por ID
   */
  findOne(id: number): Promise<ConfiguracionSesion | null>;

  /**
   * Crea una nueva configuración de sesión
   */
  create(
    dto: CreateConfiguracionSesionDto,
    creadoPorId: number,
  ): Promise<ConfiguracionSesion>;

  /**
   * Actualiza una configuración de sesión
   */
  update(
    id: number,
    dto: UpdateConfiguracionSesionDto,
  ): Promise<ConfiguracionSesion>;

  /**
   * Elimina una configuración de sesión
   */
  remove(id: number): Promise<void>;
}
