import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Persona } from '@/entities/persona/persona.entity';
import { Rol } from '@/entities/roles/rol.entity';

/**
 * Puerto para el repositorio de Autenticación
 */
export interface IAuthRepository {
  findByUsername(username: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Persona | null>;
  findByNumeroDocumento(numeroDocumento: string): Promise<Persona | null>;
  comparePassword(password: string, hashedPassword: string): boolean;
  generateToken(user: Usuario): string;
  generateTokenWithMetadata(user: Usuario): {
    access_token: string;
    expires_in: string;
  };
  hashPassword(password: string): string;
  updatePersona(id: number, data: Partial<Persona>): Promise<Persona>;
  findRolByCodigo(codigo: string): Promise<Rol | null>;
  createPersonaWithUsuario(
    personaData: Partial<Persona>,
    usuarioData: { username: string; passwordHash: string },
    rolCodigo: string,
  ): Promise<Usuario>;

  /**
   * Guardar una entidad de Usuario
   */
  saveUser(user: Usuario): Promise<Usuario>;
}
