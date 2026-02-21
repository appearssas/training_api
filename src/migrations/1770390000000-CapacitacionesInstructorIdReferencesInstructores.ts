import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Hace que capacitaciones.instructor_id referencie instructores.id (no personas.id).
 * - instructores.persona_id ya referencia personas.id.
 * - Todas las capacitaciones deben tener instructor (INNER JOIN, NOT NULL).
 * Migra datos: para cada capacitación con instructor_id = persona_id, se asigna
 * el id de la fila en instructores que tiene esa persona_id.
 * Si una persona usada como instructor no tiene fila en instructores, se crea.
 */
export class CapacitacionesInstructorIdReferencesInstructores1770390000000
  implements MigrationInterface
{
  name = 'CapacitacionesInstructorIdReferencesInstructores1770390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Si la migración se ejecutó parcialmente, instructor_id_new ya existe
    const cols = await queryRunner.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'capacitaciones' AND COLUMN_NAME = 'instructor_id_new'`,
    );
    const alreadyHasNewColumn = Array.isArray(cols) && cols.length > 0;

    if (!alreadyHasNewColumn) {
      // 1. Añadir columna temporal que referenciará a instructores.id
      await queryRunner.query(
        `ALTER TABLE \`capacitaciones\` ADD \`instructor_id_new\` int NULL`,
      );

      // 2. Crear registros en instructores para personas que están como instructor en alguna capacitación pero no tienen fila en instructores
      await queryRunner.query(`
        INSERT INTO \`instructores\` (\`persona_id\`, \`activo\`)
        SELECT DISTINCT c.\`instructor_id\`, 1
        FROM \`capacitaciones\` c
        INNER JOIN \`personas\` p ON p.\`id\` = c.\`instructor_id\`
        LEFT JOIN \`instructores\` i ON i.\`persona_id\` = c.\`instructor_id\`
        WHERE i.\`id\` IS NULL AND c.\`instructor_id\` IS NOT NULL
      `);

      // 3. Rellenar instructor_id_new con el id de instructores (por persona_id = instructor_id actual)
      await queryRunner.query(`
        UPDATE \`capacitaciones\` c
        INNER JOIN \`instructores\` i ON i.\`persona_id\` = c.\`instructor_id\`
        SET c.\`instructor_id_new\` = i.\`id\`
        WHERE c.\`instructor_id\` IS NOT NULL
      `);

      // 4. Si quedó alguna capacitación con instructor_id no nulo pero sin instructor_id_new (no debería), usar el primer instructor
      const fallback = await queryRunner.query(`
        SELECT \`id\` FROM \`instructores\` ORDER BY \`id\` ASC LIMIT 1
      `);
      const defaultInstructorId = fallback?.[0]?.id;
      if (defaultInstructorId != null) {
        await queryRunner.query(
          `UPDATE \`capacitaciones\` SET \`instructor_id_new\` = ? WHERE \`instructor_id\` IS NOT NULL AND \`instructor_id_new\` IS NULL`,
          [defaultInstructorId],
        );
      }
    }

    // 5. Eliminar FK y columna antigua (obtener nombre real de la FK desde la BD)
    const fkRows = await queryRunner.query(
      `SELECT CONSTRAINT_NAME AS constraintName
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'capacitaciones'
         AND COLUMN_NAME = 'instructor_id'
         AND REFERENCED_TABLE_NAME = 'personas'`,
    );
    const row = Array.isArray(fkRows) && fkRows.length > 0 ? fkRows[0] : null;
    const fkName = row?.constraintName ?? (row as { CONSTRAINT_NAME?: string })?.CONSTRAINT_NAME;
    if (fkName) {
      await queryRunner.query(
        `ALTER TABLE \`capacitaciones\` DROP FOREIGN KEY \`${fkName}\``,
      );
    }
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` DROP COLUMN \`instructor_id\``,
    );

    // 6. Renombrar instructor_id_new a instructor_id
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` CHANGE \`instructor_id_new\` \`instructor_id\` int NOT NULL`,
    );

    // 7. FK a instructores (todas las capacitaciones deben tener instructor)
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` ADD CONSTRAINT \`FK_capacitaciones_instructor_id\` FOREIGN KEY (\`instructor_id\`) REFERENCES \`instructores\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` DROP FOREIGN KEY \`FK_capacitaciones_instructor_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` ADD \`instructor_id_old\` int NULL`,
    );
    await queryRunner.query(`
      UPDATE \`capacitaciones\` c
      INNER JOIN \`instructores\` i ON i.\`id\` = c.\`instructor_id\`
      SET c.\`instructor_id_old\` = i.\`persona_id\`
    `);
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` DROP COLUMN \`instructor_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` CHANGE \`instructor_id_old\` \`instructor_id\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` ADD CONSTRAINT \`FK_e112e5945d2de513bb0c31b7f6f\` FOREIGN KEY (\`instructor_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
