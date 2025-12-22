import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Rol } from '@/entities/roles/rol.entity';

export class RolesSeeder extends BaseSeeder {
  async run(): Promise<void> {
    const rolesRepository = this.dataSource.getRepository(Rol);

    const rolesData = [
      {
        nombre: 'Administrador',
        codigo: 'ADMIN',
        descripcion: 'Administrador del sistema con acceso completo',
        activo: true,
      },
      {
        nombre: 'Instructor',
        codigo: 'INSTRUCTOR',
        descripcion: 'Instructor que puede crear y gestionar capacitaciones',
        activo: true,
      },
      {
        nombre: 'Alumno',
        codigo: 'ALUMNO',
        descripcion: 'Estudiante que puede inscribirse y tomar capacitaciones',
        activo: true,
      },
      {
        nombre: 'Operador',
        codigo: 'OPERADOR',
        descripcion: 'Operador del sistema con permisos básicos',
        activo: true,
      },
      {
        nombre: 'Cliente',
        codigo: 'CLIENTE',
        descripcion: 'Cliente institucional que puede cargar conductores masivamente',
        activo: true,
      },
    ];

    for (const roleData of rolesData) {
      const existingRole = await rolesRepository.findOne({
        where: { codigo: roleData.codigo },
      });

      if (!existingRole) {
        const role = rolesRepository.create(roleData);
        await rolesRepository.save(role);
        console.log(`✓ Rol creado: ${roleData.nombre} (${roleData.codigo})`);
      } else {
        console.log(`- Rol ya existe: ${roleData.nombre} (${roleData.codigo})`);
      }
    }
  }
}
