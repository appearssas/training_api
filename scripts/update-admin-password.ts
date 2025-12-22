import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import 'tsconfig-paths/register';
import { AppDataSource } from '../src/database/seeders/data-source';
import { Usuario } from '../src/entities/usuarios/usuario.entity';
import { hashPassword, comparePassword } from '../src/infrastructure/shared/helpers/bcrypt.helper';

async function updateAdminPassword() {
  dotenv.config();

  try {
    console.log('🔌 Conectando a la base de datos...');
    await AppDataSource.initialize();
    console.log('✓ Conexión establecida\n');

    const usuarioRepository = AppDataSource.getRepository(Usuario);

    // Buscar el usuario admin
    console.log('🔍 Buscando usuario admin...');
    const adminUsuario = await usuarioRepository.findOne({
      where: { username: 'admin' },
    });

    if (!adminUsuario) {
      console.error('❌ Usuario admin no encontrado');
      process.exit(1);
    }

    console.log(`✓ Usuario encontrado: ID ${adminUsuario.id}, Username: ${adminUsuario.username}`);
    console.log(`   Hash actual: ${adminUsuario.passwordHash?.substring(0, 20)}...\n`);

    // Verificar contraseña actual
    const passwordToSet = 'Admin123*.';
    console.log(`🔐 Actualizando contraseña a: ${passwordToSet}`);

    // Generar nuevo hash
    const nuevoHash = hashPassword(passwordToSet);
    console.log(`   Nuevo hash: ${nuevoHash.substring(0, 20)}...\n`);

    // Verificar que el hash funciona
    const testMatch = comparePassword(passwordToSet, nuevoHash);
    console.log(`✓ Verificación del hash: ${testMatch ? '✅ CORRECTO' : '❌ ERROR'}\n`);

    // Actualizar contraseña
    adminUsuario.passwordHash = nuevoHash;
    adminUsuario.debeCambiarPassword = false;

    await usuarioRepository.save(adminUsuario);
    console.log('✅ Contraseña actualizada exitosamente\n');

    // Verificar que se guardó correctamente
    const usuarioVerificado = await usuarioRepository.findOne({
      where: { id: adminUsuario.id },
    });

    if (usuarioVerificado) {
      const verificarMatch = comparePassword(passwordToSet, usuarioVerificado.passwordHash);
      console.log(`🔍 Verificación final: ${verificarMatch ? '✅ CORRECTO - La contraseña funciona' : '❌ ERROR - La contraseña NO funciona'}\n`);
    }

    console.log('📋 Credenciales del admin:');
    console.log('   Username: admin');
    console.log('   Password: Admin123*.');
    console.log('\n⚠️  IMPORTANTE: Cambia esta contraseña después del primer inicio de sesión');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n✓ Conexión cerrada');
    }
  }
}

updateAdminPassword();

