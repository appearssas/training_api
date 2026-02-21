import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingStatus1766185153232 implements MigrationInterface {
  name = 'AddPendingStatus1766185153232';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`estado\` enum ('PENDIENTE', 'ACTIVO', 'INACTIVO', 'BLOQUEADO') NOT NULL DEFAULT 'PENDIENTE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`usuarios\` DROP COLUMN \`estado\``);
  }
}
