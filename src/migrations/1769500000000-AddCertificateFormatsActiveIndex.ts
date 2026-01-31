import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Índice compuesto para optimizar findActive() en certificate_formats.
 * La consulta filtra por activo = 1 y ordena por fecha_actualizacion DESC.
 */
export class AddCertificateFormatsActiveIndex1769500000000
  implements MigrationInterface
{
  name = 'AddCertificateFormatsActiveIndex1769500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`IDX_certificate_formats_activo_fecha\` ON \`certificate_formats\` (\`activo\`, \`fecha_actualizacion\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_certificate_formats_activo_fecha\` ON \`certificate_formats\``,
    );
  }
}
