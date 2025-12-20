import 'reflect-metadata';
import * as dotenv from 'dotenv';
import 'tsconfig-paths/register';
import { DataSource } from 'typeorm';
import { AppDataSource } from '@/database/seeders/data-source';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Persona } from '@/entities/persona/persona.entity';

/**
 * Script para verificar que el usuario admin existe y está configurado correctamente
 */
async function verifyAdmin() {
  dotenv.config();

  try {
    await AppDataSource.initialize();
    console.log('✓ Conexión a la base de datos establecida\n');

    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const personaRepository = AppDataSource.getRepository(Persona);

    // Buscar usuario admin
    console.log('🔍 Buscando usuario "admin"...\n');
    const admin = await usuarioRepository.findOne({
      where: { username: 'admin' },
      relations: ['persona', 'rolPrincipal'],
    });

    if (!admin) {
      console.log('❌ Usuario "admin" NO encontrado en la base de datos');
      console.log('\n💡 Solución: Ejecuta el seeder nuevamente:');
      console.log('   yarn seed');
      return;
    }

    console.log('✓ Usuario encontrado:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Activo: ${admin.activo} (tipo: ${typeof admin.activo})`);
    console.log(`   Habilitado: ${admin.habilitado} (tipo: ${typeof admin.habilitado})`);
    console.log(`   Password Hash: ${admin.passwordHash ? '✓ Presente' : '❌ Ausente'}`);

    if (admin.persona) {
      console.log(`\n✓ Persona asociada:`);
      console.log(`   ID: ${admin.persona.id}`);
      console.log(`   Nombres: ${admin.persona.nombres}`);
      console.log(`   Apellidos: ${admin.persona.apellidos}`);
      console.log(`   Email: ${admin.persona.email}`);
      console.log(`   Activo: ${admin.persona.activo} (tipo: ${typeof admin.persona.activo})`);
      console.log(`   Documento: ${admin.persona.numeroDocumento}`);
    } else {
      console.log('\n❌ ERROR: Usuario no tiene persona asociada');
    }

    if (admin.rolPrincipal) {
      console.log(`\n✓ Rol asignado:`);
      console.log(`   ID: ${admin.rolPrincipal.id}`);
      console.log(`   Código: ${admin.rolPrincipal.codigo}`);
      console.log(`   Nombre: ${admin.rolPrincipal.nombre}`);
    } else {
      console.log('\n❌ ERROR: Usuario no tiene rol asignado');
    }

    // Verificar con consulta directa
    console.log('\n🔍 Verificando con consulta SQL directa...');
    const rawUser = await AppDataSource.manager.query(
      `SELECT u.id, u.username, u.activo, u.habilitado, u.password_hash, 
              p.id as persona_id, p.activo as persona_activo, p.nombres, p.apellidos, p.email,
              r.codigo as rol_codigo
       FROM usuarios u
       LEFT JOIN personas p ON u.persona_id = p.id
       LEFT JOIN roles r ON u.rol_principal_id = r.id
       WHERE u.username = ?`,
      ['admin'],
    );

    if (rawUser.length > 0) {
      console.log('✓ Usuario encontrado en consulta SQL:');
      console.log(JSON.stringify(rawUser[0], null, 2));
    } else {
      console.log('❌ Usuario NO encontrado en consulta SQL directa');
    }

    // Verificar si puede hacer login
    console.log('\n🔍 Verificando condiciones para login...');
    const isUsuarioActivo = admin.activo === true || Number(admin.activo) === 1;
    const isPersonaActiva =
      admin.persona &&
      (admin.persona.activo === true || Number(admin.persona.activo) === 1);
    const canLogin = isUsuarioActivo && isPersonaActiva;

    if (canLogin) {
      console.log('✓ Usuario cumple condiciones para login');
    } else {
      console.log('❌ Usuario NO cumple condiciones para login');
      console.log(`   Usuario activo: ${admin.activo}`);
      console.log(`   Persona activa: ${admin.persona?.activo || 'N/A'}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n✓ Conexión cerrada');
    }
  }
}

verifyAdmin();

