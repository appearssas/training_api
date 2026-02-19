import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDebeCambiarPasswordToUsuarios1766270118240 implements MigrationInterface {
  name = 'AddDebeCambiarPasswordToUsuarios1766270118240';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`debe_cambiar_password\` tinyint NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP COLUMN \`debe_cambiar_password\``,
    );
  }
}
