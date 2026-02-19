import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmpresasTableAndNormalizePersonas1767126837328 implements MigrationInterface {
  name = 'CreateEmpresasTableAndNormalizePersonas1767126837328';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla empresas
    await queryRunner.query(`
      CREATE TABLE \`empresas\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`numero_documento\` varchar(50) NOT NULL,
        \`tipo_documento\` varchar(20) NOT NULL DEFAULT 'NIT',
        \`razon_social\` varchar(500) NOT NULL,
        \`email\` varchar(255) NULL,
        \`telefono\` varchar(50) NULL,
        \`direccion\` text NULL,
        \`activo\` tinyint NOT NULL DEFAULT '1',
        \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_empresas_numero_documento\` (\`numero_documento\`),
        INDEX \`IDX_empresas_email\` (\`email\`),
        INDEX \`IDX_empresas_activo\` (\`activo\`),
        UNIQUE INDEX \`IDX_empresas_numero_documento_unique\` (\`numero_documento\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 2. Migrar datos: Crear empresas a partir de personas con razonSocial
    // Solo para personas de tipo JURIDICA o que tengan razonSocial
    await queryRunner.query(`
      INSERT INTO \`empresas\` (
        \`numero_documento\`,
        \`tipo_documento\`,
        \`razon_social\`,
        \`email\`,
        \`telefono\`,
        \`direccion\`,
        \`activo\`,
        \`fecha_creacion\`,
        \`fecha_actualizacion\`
      )
      SELECT DISTINCT
        p.\`numero_documento\`,
        p.\`tipo_documento\`,
        p.\`razon_social\`,
        p.\`email\`,
        p.\`telefono\`,
        p.\`direccion\`,
        p.\`activo\`,
        p.\`fecha_creacion\`,
        p.\`fecha_actualizacion\`
      FROM \`personas\` p
      WHERE (
        p.\`tipo_persona\` = 'JURIDICA'
        OR p.\`razon_social\` IS NOT NULL
        OR p.\`razon_social\` != ''
      )
      AND p.\`numero_documento\` NOT IN (
        SELECT \`numero_documento\` FROM \`empresas\`
      )
    `);

    // 3. Agregar columna empresa_id a personas
    await queryRunner.query(`
      ALTER TABLE \`personas\`
      ADD COLUMN \`empresa_id\` int NULL
    `);

    // 4. Crear índice para empresa_id
    await queryRunner.query(`
      CREATE INDEX \`IDX_personas_empresa_id\` ON \`personas\` (\`empresa_id\`)
    `);

    // 5. Actualizar personas: Asignar empresa_id basado en numero_documento
    // Para personas que tienen razonSocial o son tipo JURIDICA
    await queryRunner.query(`
      UPDATE \`personas\` p
      INNER JOIN \`empresas\` e ON p.\`numero_documento\` = e.\`numero_documento\`
      SET p.\`empresa_id\` = e.\`id\`
      WHERE (
        p.\`tipo_persona\` = 'JURIDICA'
        OR p.\`razon_social\` IS NOT NULL
        OR p.\`razon_social\` != ''
      )
    `);

    // 6. Para personas NATURAL que pertenecen a una empresa (CLIENTE)
    // Buscar si hay una empresa con el mismo documento y asignarla
    // Esto es para casos donde una persona natural está asociada a una empresa
    await queryRunner.query(`
      UPDATE \`personas\` p
      INNER JOIN \`usuarios\` u ON p.\`id\` = u.\`persona_id\`
      INNER JOIN \`persona_roles\` pr ON p.\`id\` = pr.\`persona_id\`
      INNER JOIN \`roles\` r ON pr.\`rol_id\` = r.\`id\`
      INNER JOIN \`empresas\` e ON p.\`numero_documento\` = e.\`numero_documento\`
      SET p.\`empresa_id\` = e.\`id\`
      WHERE r.\`codigo\` = 'CLIENTE'
      AND p.\`tipo_persona\` = 'NATURAL'
      AND p.\`empresa_id\` IS NULL
    `);

    // 7. Agregar foreign key constraint
    await queryRunner.query(`
      ALTER TABLE \`personas\`
      ADD CONSTRAINT \`FK_personas_empresa_id\`
      FOREIGN KEY (\`empresa_id\`)
      REFERENCES \`empresas\`(\`id\`)
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar foreign key constraint
    await queryRunner.query(`
      ALTER TABLE \`personas\`
      DROP FOREIGN KEY \`FK_personas_empresa_id\`
    `);

    // 2. Eliminar índice
    await queryRunner.query(`
      DROP INDEX \`IDX_personas_empresa_id\` ON \`personas\`
    `);

    // 3. Eliminar columna empresa_id
    await queryRunner.query(`
      ALTER TABLE \`personas\`
      DROP COLUMN \`empresa_id\`
    `);

    // 4. Eliminar tabla empresas
    await queryRunner.query(`DROP TABLE \`empresas\``);
  }
}
