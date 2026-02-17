import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Elimina la columna tipo de certificate_formats.
 * El tipo de certificado (alimentos/sustancias/otros) viene de la maestra de cursos
 * (capacitacion.tipoCertificado). El formato activo único ya contiene las tres configuraciones.
 */
export class RemoveTipoFromCertificateFormats1770370000000
  implements MigrationInterface
{
  name = 'RemoveTipoFromCertificateFormats1770370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`certificate_formats\` DROP INDEX \`IDX_certificate_formats_tipo\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificate_formats\` DROP COLUMN \`tipo\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`certificate_formats\` ADD \`tipo\` enum('alimentos', 'sustancias', 'otros') NOT NULL DEFAULT 'otros'`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_certificate_formats_tipo\` ON \`certificate_formats\` (\`tipo\`)`,
    );
  }
}
