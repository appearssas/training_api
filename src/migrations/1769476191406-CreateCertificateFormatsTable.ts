import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCertificateFormatsTable1769476191406 implements MigrationInterface {
  name = 'CreateCertificateFormatsTable1769476191406';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear la tabla (IF NOT EXISTS para evitar errores si ya existe)
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`certificate_formats\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`tipo\` enum('alimentos', 'sustancias', 'otros') NOT NULL,
                \`config_alimentos\` json NULL,
                \`config_sustancias\` json NULL,
                \`config_otros\` json NULL,
                \`fondo_alimentos_path\` varchar(255) NULL COMMENT 'Ruta del archivo PNG de fondo para alimentos',
                \`fondo_sustancias_path\` varchar(255) NULL COMMENT 'Ruta del archivo PNG de fondo para sustancias',
                \`fondo_general_path\` varchar(255) NULL COMMENT 'Ruta del archivo PNG de fondo general/otros',
                \`activo\` tinyint NOT NULL DEFAULT '1',
                \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_certificate_formats_tipo\` (\`tipo\`)
            ) ENGINE=InnoDB
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la tabla
    await queryRunner.query(`DROP TABLE IF EXISTS \`certificate_formats\``);
  }
}
