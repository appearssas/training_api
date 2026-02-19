import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Añade certificate_format_id a entes_certificadores para que cada ente
 * pueda tener su propio formato de certificado (Cesaroto, Andar del Llano, Confianza IPS).
 */
export class AddCertificateFormatIdToEntesCertificadores1770380000000
  implements MigrationInterface
{
  name = 'AddCertificateFormatIdToEntesCertificadores1770380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`entes_certificadores\`
      ADD COLUMN \`certificate_format_id\` int NULL,
      ADD CONSTRAINT \`FK_entes_certificadores_certificate_format\`
        FOREIGN KEY (\`certificate_format_id\`) REFERENCES \`certificate_formats\`(\`id\`) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`entes_certificadores\`
      DROP FOREIGN KEY \`FK_entes_certificadores_certificate_format\`,
      DROP COLUMN \`certificate_format_id\`
    `);
  }
}
