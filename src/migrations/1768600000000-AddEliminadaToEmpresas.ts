import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEliminadaToEmpresas1768600000000 implements MigrationInterface {
  name = 'AddEliminadaToEmpresas1768600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`empresas\`
      ADD COLUMN \`eliminada\` tinyint NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_empresas_eliminada\` ON \`empresas\` (\`eliminada\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_empresas_eliminada\` ON \`empresas\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`empresas\` DROP COLUMN \`eliminada\``,
    );
  }
}
