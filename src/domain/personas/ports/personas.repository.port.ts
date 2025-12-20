import { Persona } from '@/entities/persona/persona.entity';
import { Alumno } from '@/entities/alumnos/alumno.entity';

/**
 * Puerto para el repositorio de Personas
 */
export interface IPersonasRepository {
  /**
   * Verifica si existe una persona con el número de documento dado
   */
  findByNumeroDocumento(numeroDocumento: string): Promise<Persona | null>;

  /**
   * Verifica si existe una persona con el email dado
   */
  findByEmail(email: string): Promise<Persona | null>;

  /**
   * Crea un conductor externo (alumno externo sin usuario)
   * El conductor queda en estado "No habilitado" (sin usuario asociado)
   */
  createConductorExterno(
    personaData: Partial<Persona>,
  ): Promise<{ persona: Persona; alumno: Alumno }>;
}

