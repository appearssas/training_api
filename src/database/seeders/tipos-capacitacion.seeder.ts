import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { TipoCapacitacion } from '@/entities/catalogos/tipo-capacitacion.entity';

export class TiposCapacitacionSeeder extends BaseSeeder {
  async run(): Promise<void> {
    const tiposRepository = this.dataSource.getRepository(TipoCapacitacion);

    const tiposData = [
      {
        nombre: 'Estándar',
        codigo: 'STANDARD',
        descripcion: 'Capacitación regular sin certificación',
        activo: true,
      },
      {
        nombre: 'Certificada',
        codigo: 'CERTIFIED',
        descripcion: 'Capacitación que genera certificado',
        activo: true,
      },
      {
        nombre: 'Encuesta',
        codigo: 'SURVEY',
        descripcion: 'Encuesta de satisfacción o evaluación',
        activo: true,
      },
    ];

    for (const tipoData of tiposData) {
      const existingTipo = await tiposRepository.findOne({
        where: { codigo: tipoData.codigo },
      });

      if (!existingTipo) {
        const tipo = tiposRepository.create(tipoData);
        await tiposRepository.save(tipo);
        console.log(
          `✓ Tipo de capacitación creado: ${tipoData.nombre} (${tipoData.codigo})`,
        );
      } else {
        console.log(
          `- Tipo de capacitación ya existe: ${tipoData.nombre} (${tipoData.codigo})`,
        );
      }
    }
  }
}
