import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reemplaza config_alimentos, config_sustancias, config_otros por una sola columna config (JSON).
 * Un formato tiene una única configuración PDF; por ente pueden existir varios formatos (p. ej. por curso).
 */
export class SingleConfigCertificateFormats1770384000000
  implements MigrationInterface
{
  name = 'SingleConfigCertificateFormats1770384000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`certificate_formats\`
      ADD COLUMN \`config\` json NULL
      COMMENT 'Configuración PDF única del formato (posiciones, fuentes, etc.)'
      AFTER \`id\`
    `);

    await queryRunner.query(`
      UPDATE \`certificate_formats\`
      SET \`config\` = COALESCE(
        \`config_otros\`,
        \`config_alimentos\`,
        \`config_sustancias\`
      )
    `);

    await queryRunner.query(`
      ALTER TABLE \`certificate_formats\`
      DROP COLUMN \`config_alimentos\`,
      DROP COLUMN \`config_sustancias\`,
      DROP COLUMN \`config_otros\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`certificate_formats\`
      ADD COLUMN \`config_alimentos\` json NULL,
      ADD COLUMN \`config_sustancias\` json NULL,
      ADD COLUMN \`config_otros\` json NULL
    `);

    await queryRunner.query(`
      UPDATE \`certificate_formats\`
      SET
        \`config_alimentos\` = \`config\`,
        \`config_sustancias\` = \`config\`,
        \`config_otros\` = \`config\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`certificate_formats\`
      DROP COLUMN \`config\`
    `);
  }
}
