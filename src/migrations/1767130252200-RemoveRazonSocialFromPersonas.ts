import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRazonSocialFromPersonas1767130252200 implements MigrationInterface {
  name = 'RemoveRazonSocialFromPersonas1767130252200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna razon_social de la tabla personas
    // Esta columna ya no es necesaria porque la información de empresa
    // se almacena en la tabla empresas y se relaciona mediante empresa_id
    await queryRunner.query(`
      ALTER TABLE \`personas\`
      DROP COLUMN \`razon_social\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurar la columna razon_social en caso de revertir la migración
    // Intentar restaurar los datos desde la tabla empresas si es posible
    await queryRunner.query(`
      ALTER TABLE \`personas\`
      ADD COLUMN \`razon_social\` varchar(500) NULL
    `);

    // Restaurar datos desde empresas si existe la relación
    await queryRunner.query(`
      UPDATE \`personas\` p
      INNER JOIN \`empresas\` e ON p.\`empresa_id\` = e.\`id\`
      SET p.\`razon_social\` = e.\`razon_social\`
      WHERE p.\`empresa_id\` IS NOT NULL
    `);
  }
}
