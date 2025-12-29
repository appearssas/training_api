import { BaseSeeder } from './base.seeder';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Persona } from '@/entities/persona/persona.entity';
import { Rol } from '@/entities/roles/rol.entity';
import * as bcrypt from 'bcrypt';

export class AdminUserSeeder extends BaseSeeder {
  async run(): Promise<void> {
    const usuarioRepository = this.dataSource.getRepository(Usuario);
    const personaRepository = this.dataSource.getRepository(Persona);
    const rolRepository = this.dataSource.getRepository(Rol);

    // 1. Obtener Rol ADMIN
    const adminRole = await rolRepository.findOne({
      where: { codigo: 'ADMIN' },
    });

    if (!adminRole) {
      console.error('❌ Rol ADMIN no encontrado. Ejecuta RolesSeeder primero.');
      return;
    }

    // 2. Buscar si ya existe el usuario admin
    let user = await usuarioRepository.findOne({
      where: { username: 'admin' },
      relations: ['persona'],
    });

    if (user) {
      // Si el usuario existe, NO sobrescribir la contraseña (ya fue creada por AdminSeeder)
      console.log('✓ Usuario admin ya existe. No se modifica la contraseña.');
      console.log(
        '   Usa la contraseña configurada en AdminSeeder: Admin123*.',
      );
      return;
    } else {
      // Solo crear si no existe
      const passwordHash = await bcrypt.hash('admin123', 10);
      // Si no existe, lo crea
      const persona = personaRepository.create({
        nombres: 'Administrador',
        apellidos: 'Sistema',
        numeroDocumento: '1234567890',
        tipoDocumento: 'CC',
        email: 'admin@sistema.com',
        activo: true,
        tipoPersona: 'NATURAL',
      });
      const savedPersona = await personaRepository.save(persona);

      user = usuarioRepository.create({
        username: 'admin',
        passwordHash: passwordHash,
        persona: savedPersona,
        rolPrincipal: adminRole,
        habilitado: true,
        activo: true,
      });

      await usuarioRepository.save(user);

      savedPersona.usuario = user;
      await personaRepository.save(savedPersona);

      console.log('✓ Usuario admin creado: admin / admin123');
    }
  }
}
