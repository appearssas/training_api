import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reemplaza fondo_alimentos_path, fondo_sustancias_path, fondo_general_path
 * por una sola columna fondo_path (ruta o URL del fondo en storage/certificates o S3).
 */
export class SingleFondoPathCertificateFormats1770383000000
  implements MigrationInterface
{
  name = 'SingleFondoPathCertificateFormats1770383000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Añadir la nueva columna
    await queryRunner.query(`
      ALTER TABLE \`certificate_formats\`
      ADD COLUMN \`fondo_path\` varchar(500) NULL
      COMMENT 'Ruta o URL del PNG de fondo (storage/certificates o S3)'
      AFTER \`config_otros\`
    `);

    // Migrar datos: usar el primero no nulo de los tres
    await queryRunner.query(`
      UPDATE \`certificate_formats\`
      SET \`fondo_path\` = COALESCE(
        \`fondo_general_path\`,
        \`fondo_alimentos_path\`,
        \`fondo_sustancias_path\`
      )
    `);

    // Eliminar las tres columnas
    await queryRunner.query(`
      ALTER TABLE \`certificate_formats\`
      DROP COLUMN \`fondo_alimentos_path\`,
      DROP COLUMN \`fondo_sustancias_path\`,
      DROP COLUMN \`fondo_general_path\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`certificate_formats\`
      ADD COLUMN \`fondo_alimentos_path\` varchar(255) NULL
        COMMENT 'Ruta del archivo PNG de fondo para alimentos',
      ADD COLUMN \`fondo_sustancias_path\` varchar(255) NULL
        COMMENT 'Ruta del archivo PNG de fondo para sustancias',
      ADD COLUMN \`fondo_general_path\` varchar(255) NULL
        COMMENT 'Ruta del archivo PNG de fondo general/otros'
    `);

    await queryRunner.query(`
      UPDATE \`certificate_formats\`
      SET
        \`fondo_alimentos_path\` = \`fondo_path\`,
        \`fondo_sustancias_path\` = \`fondo_path\`,
        \`fondo_general_path\` = \`fondo_path\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`certificate_formats\`
      DROP COLUMN \`fondo_path\`
    `);
  }
}
