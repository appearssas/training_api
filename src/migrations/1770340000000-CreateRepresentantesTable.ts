import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRepresentantesTable1770340000000 implements MigrationInterface {
  name = 'CreateRepresentantesTable1770340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`representantes\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(200) NOT NULL,
        \`cargo\` varchar(200) NULL,
        \`firma_path\` varchar(500) NULL,
        \`activo\` tinyint NOT NULL DEFAULT 1,
        \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `representantes`');
  }
}
