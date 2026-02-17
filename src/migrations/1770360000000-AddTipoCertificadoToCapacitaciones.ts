import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTipoCertificadoToCapacitaciones1770360000000 implements MigrationInterface {
  name = 'AddTipoCertificadoToCapacitaciones1770360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`capacitaciones\`
      ADD COLUMN \`tipo_certificado\` varchar(20) NULL
      COMMENT 'Tipo de certificado: alimentos, sustancias, otros (formato PDF y fondo)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `capacitaciones` DROP COLUMN `tipo_certificado`');
  }
}
