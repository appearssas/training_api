import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import 'tsconfig-paths/register';
import { RolesSeeder } from './roles.seeder';
import { TiposCapacitacionSeeder } from './tipos-capacitacion.seeder';
import { ModalidadesSeeder } from './modalidades.seeder';
import { TiposPreguntaSeeder } from './tipos-pregunta.seeder';
import { TiposMaterialSeeder } from './tipos-material.seeder';
import { AdminSeeder } from './admin.seeder';
import { AppDataSource } from './data-source';

/**
 * Ejecuta todos los seeders
 */
async function runSeeders() {
  // Cargar variables de entorno
  dotenv.config();

  try {
    // Inicializar conexión a la base de datos
    await AppDataSource.initialize();
    console.log('✓ Conexión a la base de datos establecida\n');

    // Ejecutar seeders en orden
    console.log('🌱 Iniciando seeders...\n');

    const seeders = [
      new RolesSeeder(AppDataSource),
      new TiposCapacitacionSeeder(AppDataSource),
      new ModalidadesSeeder(AppDataSource),
      new TiposPreguntaSeeder(AppDataSource),
      new TiposMaterialSeeder(AppDataSource),
      new AdminSeeder(AppDataSource), // Crear administrador inicial
    ];

    for (const seeder of seeders) {
      await seeder.execute();
      console.log('');
    }

    console.log('✅ Todos los seeders se ejecutaron correctamente');
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n✓ Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runSeeders();
}

export { runSeeders };
