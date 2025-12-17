import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { ModalidadCapacitacion } from '@/entities/catalogos/modalidad-capacitacion.entity';

export class ModalidadesSeeder extends BaseSeeder {
  async run(): Promise<void> {
    const modalidadesRepository = this.dataSource.getRepository(
      ModalidadCapacitacion,
    );

    const modalidadesData = [
      {
        nombre: 'Online',
        codigo: 'ONLINE',
        activo: true,
      },
      {
        nombre: 'Presencial',
        codigo: 'ONSITE',
        activo: true,
      },
      {
        nombre: 'Mixta',
        codigo: 'HYBRID',
        activo: true,
      },
    ];

    for (const modalidadData of modalidadesData) {
      const existingModalidad = await modalidadesRepository.findOne({
        where: { codigo: modalidadData.codigo },
      });

      if (!existingModalidad) {
        const modalidad = modalidadesRepository.create(modalidadData);
        await modalidadesRepository.save(modalidad);
        console.log(
          `✓ Modalidad creada: ${modalidadData.nombre} (${modalidadData.codigo})`,
        );
      } else {
        console.log(
          `- Modalidad ya existe: ${modalidadData.nombre} (${modalidadData.codigo})`,
        );
      }
    }
  }
}
