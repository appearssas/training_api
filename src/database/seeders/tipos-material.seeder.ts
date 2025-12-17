import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { TipoMaterial } from '@/entities/catalogos/tipo-material.entity';

export class TiposMaterialSeeder extends BaseSeeder {
  async run(): Promise<void> {
    const tiposRepository = this.dataSource.getRepository(TipoMaterial);

    const tiposData = [
      {
        nombre: 'Archivo PDF',
        codigo: 'PDF',
        activo: true,
      },
      {
        nombre: 'Archivo Word',
        codigo: 'DOC',
        activo: true,
      },
      {
        nombre: 'Video',
        codigo: 'VIDEO',
        activo: true,
      },
      {
        nombre: 'Imagen',
        codigo: 'IMAGE',
        activo: true,
      },
      {
        nombre: 'Link externo',
        codigo: 'LINK',
        activo: true,
      },
      {
        nombre: 'Presentación',
        codigo: 'PRESENTATION',
        activo: true,
      },
      {
        nombre: 'Audio',
        codigo: 'AUDIO',
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
          `✓ Tipo de material creado: ${tipoData.nombre} (${tipoData.codigo})`,
        );
      } else {
        console.log(
          `- Tipo de material ya existe: ${tipoData.nombre} (${tipoData.codigo})`,
        );
      }
    }
  }
}
