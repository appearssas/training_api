import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inserta los 3 entes certificadores de negocio: Cesaroto, Andar del Llano, Confianza IPS.
 * Opcional: desactiva los entes antiguos (Ministerio de Transporte, Secretaría de Tránsito) para no borrar datos.
 */
export class SeedTresEntesCertificadores1770381000000
  implements MigrationInterface
{
  name = 'SeedTresEntesCertificadores1770381000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Desactivar entes antiguos si existen (mantener datos históricos)
    await queryRunner.query(`
      UPDATE \`entes_certificadores\`
      SET \`activo\` = 0
      WHERE \`codigo\` IN ('MINTRA', 'SECRETRAN')
    `);

    // Insertar los 3 entes de negocio (IGNORE para no duplicar si ya existen)
    await queryRunner.query(`
      INSERT IGNORE INTO \`entes_certificadores\` (\`nombre\`, \`codigo\`, \`descripcion\`, \`activo\`)
      VALUES
        ('Cesaroto', 'CESAROTO', 'Ente certificador Cesaroto', 1),
        ('Andar del Llano', 'ANDAR_LLANO', 'Ente certificador Andar del Llano', 1),
        ('Confianza IPS', 'CONFIANZA_IPS', 'Ente certificador propio Confianza IPS', 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`entes_certificadores\`
      WHERE \`codigo\` IN ('CESAROTO', 'ANDAR_LLANO', 'CONFIANZA_IPS')
    `);
    // Reactivar los antiguos si se deshace
    await queryRunner.query(`
      UPDATE \`entes_certificadores\`
      SET \`activo\` = 1
      WHERE \`codigo\` IN ('MINTRA', 'SECRETRAN')
    `);
  }
}
