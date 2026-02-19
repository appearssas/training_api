import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inserta entes certificadores por defecto (opcional para uso en producción).
 */
export class SeedEntesCertificadores1770320000000 implements MigrationInterface {
  name = 'SeedEntesCertificadores1770320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT IGNORE INTO \`entes_certificadores\` (\`nombre\`, \`codigo\`, \`descripcion\`, \`activo\`)
      VALUES
        ('Ministerio de Transporte', 'MINTRA', 'Ente certificador en materia de transporte', 1),
        ('Secretaría de Tránsito', 'SECRETRAN', 'Autoridad de tránsito local', 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`entes_certificadores\` WHERE \`codigo\` IN ('MINTRA', 'SECRETRAN')
    `);
  }
}
