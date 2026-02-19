import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnteCertificadorIdToRepresentantes1770350000000 implements MigrationInterface {
  name = 'AddEnteCertificadorIdToRepresentantes1770350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`representantes\`
      ADD COLUMN \`ente_certificador_id\` int NULL,
      ADD CONSTRAINT \`fk_representantes_ente_certificador\`
        FOREIGN KEY (\`ente_certificador_id\`) REFERENCES \`entes_certificadores\`(\`id\`) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `representantes` DROP FOREIGN KEY `fk_representantes_ente_certificador`',
    );
    await queryRunner.query(
      'ALTER TABLE `representantes` DROP COLUMN `ente_certificador_id`',
    );
  }
}
