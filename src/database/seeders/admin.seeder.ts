import { BaseSeeder } from './base.seeder';
import { Persona } from '@/entities/persona/persona.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Rol } from '@/entities/roles/rol.entity';
import { PersonaRol } from '@/entities/roles/persona-rol.entity';
import { hashPassword } from '@/infrastructure/shared/helpers/bcrypt.helper';
import { TipoDocumento } from '@/entities/persona/types';

/**
 * Seeder para crear un administrador inicial del sistema
 *
 * Este seeder crea un usuario administrador con las siguientes credenciales por defecto:
 * - Username: admin
 * - Password: admin123 (DEBE ser cambiada en producción)
 * - Email: admin@training.local
 * - Documento: 0000000000
 *
 * IMPORTANTE: Cambiar la contraseña después del primer inicio de sesión
 */
export class AdminSeeder extends BaseSeeder {
  async run(): Promise<void> {
    // Usar transacción para asegurar consistencia
    await this.dataSource.transaction(async manager => {
      const personaRepository = manager.getRepository(Persona);
      const usuarioRepository = manager.getRepository(Usuario);
      const rolRepository = manager.getRepository(Rol);
      const personaRolRepository = manager.getRepository(PersonaRol);

      // Buscar el rol de administrador
      const rolAdmin = await rolRepository.findOne({
        where: { codigo: 'ADMIN', activo: true },
      });

      if (!rolAdmin) {
        console.log(
          '⚠️  Rol ADMIN no encontrado. Ejecuta primero el RolesSeeder.',
        );
        throw new Error('Rol ADMIN no encontrado');
      }

      // Verificar si ya existe un administrador con el username 'admin'
      const existingAdmin = await usuarioRepository.findOne({
        where: { username: 'admin' },
        relations: ['persona'],
      });

      if (existingAdmin) {
        console.log('⚠️  Ya existe un administrador con username "admin".');
        console.log(
          `   ID: ${existingAdmin.id}, Email: ${existingAdmin.persona?.email || 'N/A'}`,
        );
        return; // No lanzar error, solo salir
      }

      // Verificar si ya existe una persona con el documento
      const existingPersona = await personaRepository.findOne({
        where: { numeroDocumento: '0000000000' },
      });

      if (existingPersona) {
        console.log('⚠️  Ya existe una persona con documento 0000000000.');
        return; // No lanzar error, solo salir
      }

      // Crear persona del administrador
      const persona = personaRepository.create({
        numeroDocumento: '0000000000',
        tipoDocumento: TipoDocumento.CC,
        nombres: 'Administrador',
        apellidos: 'Sistema',
        email: 'soporte@qinspecting.com',
        activo: true,
      });
      const savedPersona = await personaRepository.save(persona);
      console.log('✓ Persona del administrador creada');

      // Crear usuario administrador
      // Contraseña por defecto: Admin123*. (DEBE ser cambiada)
      const passwordHash = hashPassword('Admin123*.');
      const usuario = usuarioRepository.create({
        persona: savedPersona,
        username: 'admin',
        passwordHash,
        rolPrincipal: rolAdmin,
        habilitado: true,
        activo: true,
      });
      const savedUsuario = await usuarioRepository.save(usuario);
      console.log('✓ Usuario administrador creado');
      console.log(
        `   ID: ${savedUsuario.id}, Username: ${savedUsuario.username}, Activo: ${savedUsuario.activo}, Habilitado: ${savedUsuario.habilitado}`,
      );

      // Verificar que el usuario se creó correctamente
      const verifyUsuario = await usuarioRepository.findOne({
        where: { id: savedUsuario.id },
        relations: ['persona', 'rolPrincipal'],
      });

      if (verifyUsuario) {
        console.log('✓ Usuario verificado correctamente');
        console.log(
          `   Persona activa: ${verifyUsuario.persona?.activo}, Rol: ${verifyUsuario.rolPrincipal?.codigo}`,
        );
      } else {
        console.error(
          '❌ Error: Usuario no se pudo verificar después de crear',
        );
      }

      // Crear PersonaRol
      const personaRol = personaRolRepository.create({
        persona: savedPersona,
        rol: rolAdmin,
        activo: true,
      });
      await personaRolRepository.save(personaRol);
      console.log('✓ Rol asignado al administrador');

      console.log('\n📋 Credenciales del administrador:');
      console.log('   Username: admin');
      console.log('   Password: Admin123*.');
      console.log('   Email: soporte@qinspecting.com');
      console.log(
        '\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión',
      );
    });
  }
}
