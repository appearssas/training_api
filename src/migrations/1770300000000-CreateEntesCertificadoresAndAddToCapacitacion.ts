import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntesCertificadoresAndAddToCapacitacion1770300000000 implements MigrationInterface {
  name = 'CreateEntesCertificadoresAndAddToCapacitacion1770300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`entes_certificadores\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(200) NOT NULL,
        \`codigo\` varchar(50) NOT NULL,
        \`descripcion\` text NULL,
        \`informacion_contacto\` varchar(500) NULL,
        \`activo\` tinyint NOT NULL DEFAULT 1,
        \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_entes_certificadores_codigo\` (\`codigo\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`capacitaciones\`
      ADD COLUMN \`ente_certificador_id\` int NULL,
      ADD CONSTRAINT \`FK_capacitaciones_ente_certificador\`
        FOREIGN KEY (\`ente_certificador_id\`) REFERENCES \`entes_certificadores\` (\`id\`) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` DROP FOREIGN KEY \`FK_capacitaciones_ente_certificador\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` DROP COLUMN \`ente_certificador_id\``,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS \`entes_certificadores\``);
  }
}
