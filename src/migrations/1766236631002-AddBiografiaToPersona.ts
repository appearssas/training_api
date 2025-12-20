import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBiografiaToPersona1766236631002 implements MigrationInterface {
    name = 'AddBiografiaToPersona1766236631002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`personas\` ADD \`biografia\` text NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`personas\` DROP COLUMN \`biografia\``);
    }

}
