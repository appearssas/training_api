import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEntitiesAndAddNewTables1766017892161 implements MigrationInterface {
  name = 'UpdateEntitiesAndAddNewTables1766017892161';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`pagos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`monto\` decimal(10,2) NOT NULL, \`metodo_pago\` varchar(50) NULL, \`numero_comprobante\` varchar(100) NULL, \`fecha_pago\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`observaciones\` text NULL, \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`estudiante_id\` int NULL, \`capacitacion_id\` int NULL, \`registrado_por\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`logs_reportes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tipo_reporte\` varchar(100) NOT NULL, \`filtros\` text NULL, \`formato\` enum ('PDF', 'CSV', 'EXCEL', 'JSON') NOT NULL DEFAULT 'PDF', \`ruta_archivo\` varchar(500) NULL, \`fecha_generacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`usuario_id\` int NULL, INDEX \`IDX_41d605b85570738fd23d74ef95\` (\`tipo_reporte\`), INDEX \`IDX_c5d1cd134117b6a2e863afb6e3\` (\`fecha_generacion\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`logs_importacion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`archivo_nombre\` varchar(255) NOT NULL, \`total_registros\` int NOT NULL, \`registros_exitosos\` int NOT NULL DEFAULT '0', \`registros_fallidos\` int NOT NULL DEFAULT '0', \`errores\` text NULL, \`estado\` enum ('en_proceso', 'completado', 'fallido') NOT NULL DEFAULT 'en_proceso', \`fecha_inicio\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_fin\` datetime NULL, \`usuario_id\` int NULL, INDEX \`IDX_f1a0e8b262807a5678970dc7d2\` (\`estado\`), INDEX \`IDX_93f3701c30a22a174246f4a694\` (\`fecha_inicio\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`aceptaciones_politicas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`version\` varchar(20) NOT NULL, \`firma_digital\` text NULL, \`ip_address\` varchar(45) NULL, \`user_agent\` varchar(500) NULL, \`fecha_aceptacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`usuario_id\` int NULL, \`documento_legal_id\` int NULL, INDEX \`IDX_18d6db906afc77db07d1339bc5\` (\`fecha_aceptacion\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`documentos_legales\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tipo\` varchar(50) NOT NULL, \`titulo\` varchar(200) NOT NULL, \`contenido\` longtext NOT NULL, \`version\` varchar(20) NOT NULL DEFAULT '1.0', \`requiere_firma_digital\` tinyint NOT NULL DEFAULT '0', \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`creado_por\` int NULL, INDEX \`IDX_0eff54b13f665f4940043fe58a\` (\`tipo\`), INDEX \`IDX_b2a57d42f2aa200a83dd63fb03\` (\`activo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`auditoria_certificados_retroactivos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`fecha_aprobacion_real\` datetime NOT NULL, \`fecha_retroactiva\` datetime NOT NULL, \`justificacion\` text NOT NULL, \`fecha_emision\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`certificado_id\` int NULL, \`emitido_por\` int NULL, INDEX \`IDX_618d3f4576b7baa979f94f3a02\` (\`fecha_emision\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`configuracion_alertas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`dias_antes_vencimiento\` int NOT NULL, \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_53ba2552f4a0f3c40a6f16d9f1\` (\`dias_antes_vencimiento\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`alertas_vencimiento\` (\`id\` int NOT NULL AUTO_INCREMENT, \`dias_restantes\` int NOT NULL, \`fecha_envio\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`enviado\` tinyint NOT NULL DEFAULT '0', \`fecha_vencimiento\` date NOT NULL, \`certificado_id\` int NULL, INDEX \`IDX_175ec44742d13d099b8583b9bd\` (\`fecha_envio\`), INDEX \`IDX_4c3c1879b3c1707fc54d7ca453\` (\`fecha_vencimiento\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`alumnos\` ADD \`es_externo\` tinyint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`preguntas\` ADD \`imagen_url\` varchar(500) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` ADD \`fecha_aprobacion_real\` datetime NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` ADD \`fecha_retroactiva\` datetime NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` ADD \`es_retroactivo\` tinyint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` ADD \`justificacion_retroactiva\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` ADD \`url_verificacion_publica\` varchar(500) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` ADD \`codigo_qr\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` ADD \`firma_digital\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`inscripciones\` ADD \`pago_id\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` ADD \`duracion_vigencia_dias\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`personas\` ADD \`tipo_persona\` enum ('NATURAL', 'JURIDICA') NOT NULL DEFAULT 'NATURAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`personas\` ADD \`razon_social\` varchar(500) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`habilitado\` tinyint NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`personas\` CHANGE \`apellidos\` \`apellidos\` varchar(200) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pagos\` ADD CONSTRAINT \`FK_9daa4ebf16e6a9deaf271e9dfd5\` FOREIGN KEY (\`estudiante_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pagos\` ADD CONSTRAINT \`FK_c3a3e7f97eb47e5dc72860fb1ee\` FOREIGN KEY (\`capacitacion_id\`) REFERENCES \`capacitaciones\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pagos\` ADD CONSTRAINT \`FK_fd3d4d3312f40f3fbe317bca82a\` FOREIGN KEY (\`registrado_por\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`inscripciones\` ADD CONSTRAINT \`FK_20c8cffffa2427aeafe7178e034\` FOREIGN KEY (\`pago_id\`) REFERENCES \`pagos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`logs_reportes\` ADD CONSTRAINT \`FK_c78305f2f3be9adf9c1b6dd0005\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`logs_importacion\` ADD CONSTRAINT \`FK_c18ec1867fc59e929d2585e0101\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`aceptaciones_politicas\` ADD CONSTRAINT \`FK_799234cc68362d69ec03513b2a0\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`aceptaciones_politicas\` ADD CONSTRAINT \`FK_f88c0e86bd1fcfcc3600f10adab\` FOREIGN KEY (\`documento_legal_id\`) REFERENCES \`documentos_legales\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`documentos_legales\` ADD CONSTRAINT \`FK_5f0442f7b123a7b612c7411830e\` FOREIGN KEY (\`creado_por\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auditoria_certificados_retroactivos\` ADD CONSTRAINT \`FK_3719ccc669446deb5a0877038b6\` FOREIGN KEY (\`certificado_id\`) REFERENCES \`certificados\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auditoria_certificados_retroactivos\` ADD CONSTRAINT \`FK_e390c8160428596144f098ffbe5\` FOREIGN KEY (\`emitido_por\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`alertas_vencimiento\` ADD CONSTRAINT \`FK_bd846e12f5a7252c1e0ba503a94\` FOREIGN KEY (\`certificado_id\`) REFERENCES \`certificados\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`alertas_vencimiento\` DROP FOREIGN KEY \`FK_bd846e12f5a7252c1e0ba503a94\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auditoria_certificados_retroactivos\` DROP FOREIGN KEY \`FK_e390c8160428596144f098ffbe5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auditoria_certificados_retroactivos\` DROP FOREIGN KEY \`FK_3719ccc669446deb5a0877038b6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`documentos_legales\` DROP FOREIGN KEY \`FK_5f0442f7b123a7b612c7411830e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`aceptaciones_politicas\` DROP FOREIGN KEY \`FK_f88c0e86bd1fcfcc3600f10adab\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`aceptaciones_politicas\` DROP FOREIGN KEY \`FK_799234cc68362d69ec03513b2a0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`logs_importacion\` DROP FOREIGN KEY \`FK_c18ec1867fc59e929d2585e0101\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`logs_reportes\` DROP FOREIGN KEY \`FK_c78305f2f3be9adf9c1b6dd0005\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`inscripciones\` DROP FOREIGN KEY \`FK_20c8cffffa2427aeafe7178e034\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pagos\` DROP FOREIGN KEY \`FK_fd3d4d3312f40f3fbe317bca82a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pagos\` DROP FOREIGN KEY \`FK_c3a3e7f97eb47e5dc72860fb1ee\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`pagos\` DROP FOREIGN KEY \`FK_9daa4ebf16e6a9deaf271e9dfd5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`personas\` CHANGE \`apellidos\` \`apellidos\` varchar(200) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP COLUMN \`habilitado\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`personas\` DROP COLUMN \`razon_social\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`personas\` DROP COLUMN \`tipo_persona\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` DROP COLUMN \`duracion_vigencia_dias\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`inscripciones\` DROP COLUMN \`pago_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` DROP COLUMN \`firma_digital\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` DROP COLUMN \`codigo_qr\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` DROP COLUMN \`url_verificacion_publica\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` DROP COLUMN \`justificacion_retroactiva\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` DROP COLUMN \`es_retroactivo\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` DROP COLUMN \`fecha_retroactiva\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` DROP COLUMN \`fecha_aprobacion_real\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`preguntas\` DROP COLUMN \`imagen_url\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`alumnos\` DROP COLUMN \`es_externo\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_4c3c1879b3c1707fc54d7ca453\` ON \`alertas_vencimiento\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_175ec44742d13d099b8583b9bd\` ON \`alertas_vencimiento\``,
    );
    await queryRunner.query(`DROP TABLE \`alertas_vencimiento\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_53ba2552f4a0f3c40a6f16d9f1\` ON \`configuracion_alertas\``,
    );
    await queryRunner.query(`DROP TABLE \`configuracion_alertas\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_618d3f4576b7baa979f94f3a02\` ON \`auditoria_certificados_retroactivos\``,
    );
    await queryRunner.query(
      `DROP TABLE \`auditoria_certificados_retroactivos\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b2a57d42f2aa200a83dd63fb03\` ON \`documentos_legales\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0eff54b13f665f4940043fe58a\` ON \`documentos_legales\``,
    );
    await queryRunner.query(`DROP TABLE \`documentos_legales\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_18d6db906afc77db07d1339bc5\` ON \`aceptaciones_politicas\``,
    );
    await queryRunner.query(`DROP TABLE \`aceptaciones_politicas\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_93f3701c30a22a174246f4a694\` ON \`logs_importacion\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_f1a0e8b262807a5678970dc7d2\` ON \`logs_importacion\``,
    );
    await queryRunner.query(`DROP TABLE \`logs_importacion\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c5d1cd134117b6a2e863afb6e3\` ON \`logs_reportes\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_41d605b85570738fd23d74ef95\` ON \`logs_reportes\``,
    );
    await queryRunner.query(`DROP TABLE \`logs_reportes\``);
    await queryRunner.query(`DROP TABLE \`pagos\``);
  }
}
