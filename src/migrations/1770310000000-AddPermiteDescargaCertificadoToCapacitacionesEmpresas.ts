import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermiteDescargaCertificadoToCapacitacionesEmpresas1770310000000 implements MigrationInterface {
  name = 'AddPermiteDescargaCertificadoToCapacitacionesEmpresas1770310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`capacitaciones_empresas\`
      ADD COLUMN \`permite_descarga_certificado\` tinyint NOT NULL DEFAULT 1
      COMMENT 'Si la empresa permite que los alumnos descarguen el PDF del certificado para este curso'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`capacitaciones_empresas\`
      DROP COLUMN \`permite_descarga_certificado\`
    `);
  }
}
