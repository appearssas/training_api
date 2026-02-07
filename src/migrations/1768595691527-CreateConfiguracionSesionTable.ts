import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConfiguracionSesionTable1768595691527 implements MigrationInterface {
  name = 'CreateConfiguracionSesionTable1768595691527';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe (el alias puede llegar como count o COUNT según el driver)
    const tableResult = await queryRunner.query(`
            SELECT COUNT(*) as count
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            AND table_name = 'configuracion_sesion'
        `);
    const tableRow = Array.isArray(tableResult) ? tableResult[0] : tableResult;
    const tableCount = Number(
      (tableRow as Record<string, unknown>)?.count ??
        (tableRow as Record<string, unknown>)?.COUNT ??
        Object.values((tableRow as Record<string, unknown>) || {})[0] ??
        0,
    );

    if (tableCount === 0) {
      // Crear la tabla configuracion_sesion
      await queryRunner.query(`
                CREATE TABLE \`configuracion_sesion\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`tiempo_inactividad_minutos\` int NULL,
                    \`tiempo_maximo_sesion_minutos\` int NULL,
                    \`activo\` tinyint NOT NULL DEFAULT '1',
                    \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    \`creado_por\` int NULL,
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
    }

    // Verificar si la foreign key ya existe (mismo criterio con el alias)
    const fkResult = await queryRunner.query(`
            SELECT COUNT(*) as count
            FROM information_schema.table_constraints
            WHERE table_schema = DATABASE()
            AND table_name = 'configuracion_sesion'
            AND constraint_name = 'FK_configuracion_sesion_creado_por'
        `);
    const fkRow = Array.isArray(fkResult) ? fkResult[0] : fkResult;
    const fkCount = Number(
      (fkRow as Record<string, unknown>)?.count ??
        (fkRow as Record<string, unknown>)?.COUNT ??
        Object.values((fkRow as Record<string, unknown>) || {})[0] ??
        0,
    );

    if (fkCount === 0) {
      // Agregar foreign key a usuarios
      await queryRunner.query(`
                ALTER TABLE \`configuracion_sesion\`
                ADD CONSTRAINT \`FK_configuracion_sesion_creado_por\`
                FOREIGN KEY (\`creado_por\`) REFERENCES \`usuarios\`(\`id\`)
                ON DELETE NO ACTION ON UPDATE NO ACTION
            `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign key
    await queryRunner.query(`
            ALTER TABLE \`configuracion_sesion\`
            DROP FOREIGN KEY \`FK_configuracion_sesion_creado_por\`
        `);

    // Eliminar la tabla
    await queryRunner.query(`DROP TABLE \`configuracion_sesion\``);
  }
}
