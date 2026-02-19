import { BaseSeeder } from './base.seeder';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { hashPassword } from '@/infrastructure/shared/helpers/bcrypt.helper';

/**
 * Seeder para actualizar la contraseña del admin a Admin123*.
 *
 * Este seeder actualiza la contraseña del usuario admin a Admin123*.
 * Útil cuando necesitas resetear la contraseña del admin.
 */
export class UpdateAdminPasswordSeeder extends BaseSeeder {
  async run(): Promise<void> {
    const usuarioRepository = this.dataSource.getRepository(Usuario);

    // Buscar el usuario admin
    const adminUsuario = await usuarioRepository.findOne({
      where: { username: 'admin' },
    });

    if (!adminUsuario) {
      console.log(
        '⚠️  Usuario admin no encontrado. Ejecuta primero AdminSeeder.',
      );
      return;
    }

    // Actualizar la contraseña a Admin123*.
    const nuevaPassword = 'Admin123*.';
    const passwordHash = hashPassword(nuevaPassword);

    adminUsuario.passwordHash = passwordHash;
    adminUsuario.debeCambiarPassword = false; // Ya no debe cambiar la contraseña

    await usuarioRepository.save(adminUsuario);

    console.log('✓ Contraseña del admin actualizada exitosamente');
    console.log('   Username: admin');
    console.log('   Password: Admin123*.');
    console.log(
      '\n⚠️  IMPORTANTE: Cambia esta contraseña después del primer inicio de sesión',
    );
  }
}
