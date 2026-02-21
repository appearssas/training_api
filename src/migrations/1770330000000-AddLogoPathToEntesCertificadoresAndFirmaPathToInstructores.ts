import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLogoPathToEntesCertificadoresAndFirmaPathToInstructores1770330000000 implements MigrationInterface {
  name =
    'AddLogoPathToEntesCertificadoresAndFirmaPathToInstructores1770330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`entes_certificadores\` ADD \`logo_path\` varchar(500) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`instructores\` ADD \`firma_path\` varchar(500) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`entes_certificadores\` DROP COLUMN \`logo_path\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`instructores\` DROP COLUMN \`firma_path\``,
    );
  }
}
