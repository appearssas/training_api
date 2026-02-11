import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCapacitacionesEmpresas1770200000000 implements MigrationInterface {
  name = 'CreateCapacitacionesEmpresas1770200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`capacitaciones_empresas\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`empresa_id\` int NOT NULL,
        \`capacitacion_id\` int NOT NULL,
        \`fecha_asignacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_empresa_capacitacion\` (\`empresa_id\`, \`capacitacion_id\`),
        CONSTRAINT \`FK_capacitaciones_empresas_empresa\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_capacitaciones_empresas_capacitacion\` FOREIGN KEY (\`capacitacion_id\`) REFERENCES \`capacitaciones\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`capacitaciones_empresas\``);
  }
}
