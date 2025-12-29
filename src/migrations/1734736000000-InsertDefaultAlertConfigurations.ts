import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertDefaultAlertConfigurations1734736000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insertar configuraciones por defecto para alertas de vencimiento
    await queryRunner.query(`
      INSERT INTO configuracion_alertas (dias_antes_vencimiento, activo, fecha_creacion)
      VALUES
        (30, 1, NOW()),  -- Alerta 30 días antes del vencimiento
        (7, 1, NOW()),   -- Alerta 7 días antes del vencimiento
        (0, 1, NOW())    -- Alerta el mismo día del vencimiento
      ON DUPLICATE KEY UPDATE activo = VALUES(activo);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar configuraciones por defecto
    await queryRunner.query(`
      DELETE FROM configuracion_alertas
      WHERE dias_antes_vencimiento IN (30, 7, 0);
    `);
  }
}
