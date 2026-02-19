import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Añade a instructores campos para el certificado: rol, tarjeta_profesional, licencia.
 */
export class AddRolTarjetaLicenciaToInstructores1770385000000
  implements MigrationInterface
{
  name = 'AddRolTarjetaLicenciaToInstructores1770385000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`instructores\`
      ADD COLUMN \`rol\` varchar(200) NULL COMMENT 'Rol mostrado en certificado (ej: Instructor / Entrenador)',
      ADD COLUMN \`tarjeta_profesional\` varchar(200) NULL COMMENT 'Tarjeta profesional (ej: TSA RM 30937322)',
      ADD COLUMN \`licencia\` varchar(200) NULL COMMENT 'Licencia (ej: Licencia SST)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`instructores\`
      DROP COLUMN \`rol\`,
      DROP COLUMN \`tarjeta_profesional\`,
      DROP COLUMN \`licencia\`
    `);
  }
}
