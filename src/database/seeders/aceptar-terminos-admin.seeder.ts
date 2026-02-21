import { BaseSeeder } from './base.seeder';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';
import { AceptacionPolitica } from '@/entities/aceptaciones/aceptacion-politica.entity';

/**
 * Seeder para aceptar automáticamente los términos y condiciones para el usuario admin
 *
 * Este seeder busca el usuario admin y acepta todos los documentos legales activos
 * para que el admin pueda iniciar sesión sin problemas.
 */
export class AceptarTerminosAdminSeeder extends BaseSeeder {
  async run(): Promise<void> {
    const usuarioRepository = this.dataSource.getRepository(Usuario);
    const documentoLegalRepository =
      this.dataSource.getRepository(DocumentoLegal);
    const aceptacionRepository =
      this.dataSource.getRepository(AceptacionPolitica);

    // 1. Buscar el usuario admin
    const adminUsuario = await usuarioRepository.findOne({
      where: { username: 'admin' },
      relations: ['rolPrincipal'],
    });

    if (!adminUsuario) {
      console.log(
        '⚠️  Usuario admin no encontrado. Ejecuta primero AdminSeeder o AdminUserSeeder.',
      );
      return;
    }

    console.log(
      `✓ Usuario admin encontrado: ID ${adminUsuario.id}, Username: ${adminUsuario.username}`,
    );

    // 2. Buscar todos los documentos legales activos
    const documentosActivos = await documentoLegalRepository.find({
      where: { activo: true },
    });

    if (documentosActivos.length === 0) {
      console.log(
        '⚠️  No hay documentos legales activos. Ejecuta primero DocumentosLegalesSeeder.',
      );
      return;
    }

    console.log(
      `✓ Encontrados ${documentosActivos.length} documento(s) legal(es) activo(s)`,
    );

    // 3. Aceptar cada documento para el admin
    let aceptacionesCreadas = 0;
    let aceptacionesExistentes = 0;

    for (const documento of documentosActivos) {
      // Verificar si ya existe una aceptación para este documento
      const aceptacionExistente = await aceptacionRepository.findOne({
        where: {
          usuario: { id: adminUsuario.id },
          documentoLegal: { id: documento.id },
        },
      });

      if (aceptacionExistente) {
        console.log(
          `- Aceptación ya existe para documento: ${documento.titulo} (${documento.tipo})`,
        );
        aceptacionesExistentes++;
        continue;
      }

      // Crear nueva aceptación
      const aceptacion = aceptacionRepository.create({
        usuario: adminUsuario,
        documentoLegal: documento,
        version: documento.version,
        ipAddress: '127.0.0.1', // IP local para seeders
        userAgent: 'Seeder/Automated', // User agent para seeders
      });

      await aceptacionRepository.save(aceptacion);
      console.log(
        `✓ Aceptación creada para documento: ${documento.titulo} (${documento.tipo}) - Versión ${documento.version}`,
      );
      aceptacionesCreadas++;
    }

    console.log('\n📋 Resumen de aceptaciones:');
    console.log(`   Aceptaciones creadas: ${aceptacionesCreadas}`);
    console.log(`   Aceptaciones existentes: ${aceptacionesExistentes}`);
    console.log(`   Total documentos activos: ${documentosActivos.length}`);

    if (aceptacionesCreadas > 0) {
      console.log(
        '\n✅ Términos y condiciones aceptados para el usuario admin',
      );
    } else if (aceptacionesExistentes === documentosActivos.length) {
      console.log('\n✅ El admin ya tiene todos los términos aceptados');
    }
  }
}
