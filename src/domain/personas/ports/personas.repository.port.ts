import { Persona } from '@/entities/persona/persona.entity';
import { Alumno } from '@/entities/alumnos/alumno.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';

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
   * Busca una persona por su ID con todas las relaciones necesarias
   */
  findById(id: number): Promise<Persona | null>;

  /**
   * Crea un conductor externo con usuario y contraseña temporal
   * El usuario queda habilitado pero debe cambiar la contraseña en el primer login
   */
  createConductorExterno(personaData: Partial<Persona>): Promise<{
    persona: Persona;
    alumno: Alumno;
    usuario: Usuario;
    passwordTemporal: string;
  }>;
}
