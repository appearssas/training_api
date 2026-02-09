import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssistantEmpresaQuotaAndUsage1769700000000 implements MigrationInterface {
  name = 'CreateAssistantEmpresaQuotaAndUsage1769700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`assistant_empresa_quota\` (
        \`empresa_id\` int NOT NULL,
        \`token_quota_monthly\` int unsigned NOT NULL DEFAULT 0,
        \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`empresa_id\`),
        CONSTRAINT \`FK_assistant_empresa_quota_empresa\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`assistant_empresa_usage\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`empresa_id\` int NOT NULL,
        \`month\` varchar(7) NOT NULL,
        \`tokens_used\` int unsigned NOT NULL DEFAULT 0,
        \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_empresa_month\` (\`empresa_id\`, \`month\`),
        CONSTRAINT \`FK_assistant_empresa_usage_empresa\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`assistant_empresa_usage\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`assistant_empresa_quota\``);
  }
}
