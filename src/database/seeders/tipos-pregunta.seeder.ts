import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { TipoPregunta } from '@/entities/catalogos/tipo-pregunta.entity';

export class TiposPreguntaSeeder extends BaseSeeder {
  async run(): Promise<void> {
    const tiposRepository = this.dataSource.getRepository(TipoPregunta);

    const tiposData = [
      {
        nombre: 'Selección única',
        codigo: 'SINGLE_CHOICE',
        permiteMultipleRespuesta: false,
        requiereTextoLibre: false,
        activo: true,
      },
      {
        nombre: 'Selección múltiple',
        codigo: 'MULTIPLE_CHOICE',
        permiteMultipleRespuesta: true,
        requiereTextoLibre: false,
        activo: true,
      },
      {
        nombre: 'Respuesta abierta',
        codigo: 'OPEN_TEXT',
        permiteMultipleRespuesta: false,
        requiereTextoLibre: true,
        activo: true,
      },
      {
        nombre: 'Verdadero/Falso',
        codigo: 'TRUE_FALSE',
        permiteMultipleRespuesta: false,
        requiereTextoLibre: false,
        activo: true,
      },
      {
        nombre: 'Completar espacios',
        codigo: 'FILL_BLANKS',
        permiteMultipleRespuesta: false,
        requiereTextoLibre: true,
        activo: true,
      },
      {
        nombre: 'Emparejamiento',
        codigo: 'MATCHING',
        permiteMultipleRespuesta: true,
        requiereTextoLibre: false,
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
          `✓ Tipo de pregunta creado: ${tipoData.nombre} (${tipoData.codigo})`,
        );
      } else {
        console.log(
          `- Tipo de pregunta ya existe: ${tipoData.nombre} (${tipoData.codigo})`,
        );
      }
    }
  }
}
