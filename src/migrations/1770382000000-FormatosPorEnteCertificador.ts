import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Formatos por ente: crea un registro en certificate_formats por cada uno de los 3 entes
 * (Cesaroto, Andar del Llano, Confianza IPS) y los asigna en entes_certificadores.certificate_format_id.
 * Config y fondos por defecto; cada ente puede personalizarse después desde Configuración.
 */
export class FormatosPorEnteCertificador1770382000000 implements MigrationInterface {
  name = 'FormatosPorEnteCertificador1770382000000';

  /** Configuración JSON por defecto para posiciones del certificado (otros/alimentos/sustancias) */
  private static readonly DEFAULT_CONFIG_OTROS = JSON.stringify({
    cursoNombre: { x: 396, y: 395, fontSize: 18, bold: true, color: [41, 37, 97] },
    nombreEstudiante: { x: 396, y: 290, fontSize: 18, bold: true, color: [41, 37, 97] },
    documento: { x: 450, y: 320, fontSize: 18, bold: false },
    duracion: { x: 445, y: 422, fontSize: 14, bold: false },
    fechaEmision: { x: 250, y: 437, fontSize: 14, bold: false },
    fechaVencimiento: { x: 520, y: 438, fontSize: 14, bold: false },
    qr: { x: 689, y: 449, size: 70 },
    instructorFirma: { x: 130, y: 450, width: 190, height: 80 },
    instructorNombre: { x: 150, y: 505, fontSize: 10, bold: true, color: [41, 37, 97] },
    instructorRol: { x: 150, y: 513, fontSize: 9.5, bold: false, lineSpacing: 12, color: [41, 37, 97] },
    representanteFirma: { x: 495, y: 445, width: 145, height: 61 },
    representanteNombre: { x: 485, y: 505, fontSize: 9.9, bold: true, color: [41, 37, 97] },
    representanteRol: { x: 515, y: 513, fontSize: 9.5, bold: false, color: [41, 37, 97] },
    footer: { x: 396, y: 590, fontSize: 7, bold: true, color: [41, 37, 97] },
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    const configOtros = FormatosPorEnteCertificador1770382000000.DEFAULT_CONFIG_OTROS;

    // 1. Crear formato para Cesaroto
    await queryRunner.query(
      `
      INSERT INTO \`certificate_formats\`
        (\`config_otros\`, \`config_alimentos\`, \`config_sustancias\`, \`activo\`)
      VALUES (?, NULL, NULL, 0)
      `,
      [configOtros],
    );
    const [row1] = await queryRunner.query(
      `SELECT \`id\` FROM \`certificate_formats\` ORDER BY \`id\` DESC LIMIT 1`,
    );
    const idCesaroto = row1?.id;

    // 2. Crear formato para Andar del Llano
    await queryRunner.query(
      `
      INSERT INTO \`certificate_formats\`
        (\`config_otros\`, \`config_alimentos\`, \`config_sustancias\`, \`activo\`)
      VALUES (?, NULL, NULL, 0)
      `,
      [configOtros],
    );
    const [row2] = await queryRunner.query(
      `SELECT \`id\` FROM \`certificate_formats\` ORDER BY \`id\` DESC LIMIT 1`,
    );
    const idAndarLlano = row2?.id;

    // 3. Crear formato para Confianza IPS
    await queryRunner.query(
      `
      INSERT INTO \`certificate_formats\`
        (\`config_otros\`, \`config_alimentos\`, \`config_sustancias\`, \`activo\`)
      VALUES (?, NULL, NULL, 0)
      `,
      [configOtros],
    );
    const [row3] = await queryRunner.query(
      `SELECT \`id\` FROM \`certificate_formats\` ORDER BY \`id\` DESC LIMIT 1`,
    );
    const idConfianzaIps = row3?.id;

    // 4. Asignar cada formato al ente correspondiente (por código)
    if (idCesaroto != null) {
      await queryRunner.query(
        `UPDATE \`entes_certificadores\` SET \`certificate_format_id\` = ? WHERE \`codigo\` = 'CESAROTO'`,
        [idCesaroto],
      );
    }
    if (idAndarLlano != null) {
      await queryRunner.query(
        `UPDATE \`entes_certificadores\` SET \`certificate_format_id\` = ? WHERE \`codigo\` = 'ANDAR_LLANO'`,
        [idAndarLlano],
      );
    }
    if (idConfianzaIps != null) {
      await queryRunner.query(
        `UPDATE \`entes_certificadores\` SET \`certificate_format_id\` = ? WHERE \`codigo\` = 'CONFIANZA_IPS'`,
        [idConfianzaIps],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Desasignar formatos de los entes
    await queryRunner.query(`
      UPDATE \`entes_certificadores\`
      SET \`certificate_format_id\` = NULL
      WHERE \`codigo\` IN ('CESAROTO', 'ANDAR_LLANO', 'CONFIANZA_IPS')
    `);

    // Obtener los 3 IDs más recientes de certificate_formats (los creados por esta migración)
    const rows = await queryRunner.query(
      `SELECT \`id\` FROM \`certificate_formats\` ORDER BY \`fecha_creacion\` DESC LIMIT 3`,
    );
    const ids = Array.isArray(rows) ? rows.map((r: { id: number }) => r.id) : [];
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      await queryRunner.query(
        `DELETE FROM \`certificate_formats\` WHERE \`id\` IN (${placeholders})`,
        ids,
      );
    }
  }
}
