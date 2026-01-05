import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImagenFieldsToOpcionRespuesta1767623851453 implements MigrationInterface {
  name = 'AddImagenFieldsToOpcionRespuesta1767623851453';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna imagen_url a la tabla opciones_respuesta
    await queryRunner.query(`
      ALTER TABLE \`opciones_respuesta\`
      ADD COLUMN \`imagen_url\` varchar(500) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar columna imagen_url
    await queryRunner.query(`
      ALTER TABLE \`opciones_respuesta\`
      DROP COLUMN \`imagen_url\`
    `);
  }
}
