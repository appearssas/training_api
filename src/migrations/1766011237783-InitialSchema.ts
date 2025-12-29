import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1766011237783 implements MigrationInterface {
  name = 'InitialSchema1766011237783';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`alumnos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`codigo_estudiante\` varchar(50) NULL, \`fecha_ingreso\` date NULL, \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`persona_id\` int NULL, UNIQUE INDEX \`IDX_1c4bf20b7f94e724088a4c9867\` (\`codigo_estudiante\`), UNIQUE INDEX \`REL_81923965e846ea6bc6b1ae7a42\` (\`persona_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`instructores\` (\`id\` int NOT NULL AUTO_INCREMENT, \`especialidad\` varchar(200) NULL, \`biografia\` text NULL, \`calificacion_promedio\` decimal(3,2) NULL, \`total_capacitaciones\` int NOT NULL DEFAULT '0', \`total_estudiantes\` int NOT NULL DEFAULT '0', \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`persona_id\` int NULL, UNIQUE INDEX \`REL_37d658e0238dd3373fa1c35dbf\` (\`persona_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tipos_capacitacion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(100) NOT NULL, \`codigo\` varchar(20) NOT NULL, \`descripcion\` text NULL, \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_14199ab69b3551092772c55223\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`modalidades_capacitacion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(50) NOT NULL, \`codigo\` varchar(20) NOT NULL, \`activo\` tinyint NOT NULL DEFAULT '1', UNIQUE INDEX \`IDX_5147a1f9834ea887b6ad079f5b\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tipos_material\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(100) NOT NULL, \`codigo\` varchar(50) NOT NULL, \`activo\` tinyint NOT NULL DEFAULT '1', UNIQUE INDEX \`IDX_9d5b5f0539bf38ef94057247d9\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`materiales_capacitacion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(200) NOT NULL, \`url\` varchar(1000) NOT NULL, \`descripcion\` text NULL, \`orden\` int NOT NULL DEFAULT '0', \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`capacitacion_id\` int NULL, \`tipo_material_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tipos_pregunta\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(100) NOT NULL, \`codigo\` varchar(50) NOT NULL, \`permite_multiple_respuesta\` tinyint NOT NULL DEFAULT '0', \`requiere_texto_libre\` tinyint NOT NULL DEFAULT '0', \`activo\` tinyint NOT NULL DEFAULT '1', UNIQUE INDEX \`IDX_d5c17199022eb4a2def526b504\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`respuestas_multiples\` (\`id\` int NOT NULL AUTO_INCREMENT, \`respuesta_estudiante_id\` int NULL, \`opcion_respuesta_id\` int NULL, UNIQUE INDEX \`IDX_ec1f5a65dbec68dca47316fe9c\` (\`respuesta_estudiante_id\`, \`opcion_respuesta_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`respuestas_estudiante\` (\`id\` int NOT NULL AUTO_INCREMENT, \`texto_respuesta\` text NULL, \`puntaje_obtenido\` decimal(10,2) NOT NULL DEFAULT '0.00', \`fecha_respuesta\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`intento_evaluacion_id\` int NULL, \`pregunta_id\` int NULL, \`opcion_respuesta_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`opciones_respuesta\` (\`id\` int NOT NULL AUTO_INCREMENT, \`texto\` varchar(1000) NOT NULL, \`es_correcta\` tinyint NOT NULL DEFAULT '0', \`puntaje_parcial\` decimal(10,2) NOT NULL DEFAULT '0.00', \`orden\` int NOT NULL DEFAULT '0', \`pregunta_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`preguntas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`enunciado\` text NOT NULL, \`puntaje\` decimal(10,2) NOT NULL DEFAULT '1.00', \`orden\` int NOT NULL DEFAULT '0', \`requerida\` tinyint NOT NULL DEFAULT '1', \`activo\` tinyint NOT NULL DEFAULT '1', \`evaluacion_id\` int NULL, \`tipo_pregunta_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`evaluaciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`titulo\` varchar(300) NOT NULL, \`descripcion\` text NULL, \`tiempo_limite_minutos\` int NULL, \`intentos_permitidos\` int NOT NULL DEFAULT '1', \`mostrar_resultados\` tinyint NOT NULL DEFAULT '1', \`mostrar_respuestas_correctas\` tinyint NOT NULL DEFAULT '0', \`puntaje_total\` decimal(10,2) NOT NULL DEFAULT '100.00', \`minimo_aprobacion\` decimal(5,2) NOT NULL DEFAULT '70.00', \`orden\` int NOT NULL DEFAULT '0', \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`capacitacion_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`intentos_evaluacion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`numero_intento\` int NOT NULL DEFAULT '1', \`fecha_inicio\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_finalizacion\` datetime NULL, \`puntaje_obtenido\` decimal(10,2) NOT NULL DEFAULT '0.00', \`puntaje_total\` decimal(10,2) NULL, \`porcentaje\` decimal(5,2) NULL, \`aprobado\` tinyint NULL, \`tiempo_utilizado_minutos\` int NULL, \`estado\` enum ('en_progreso', 'completado', 'abandonado') NOT NULL DEFAULT 'en_progreso', \`evaluacion_id\` int NULL, \`inscripcion_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`certificados\` (\`id\` int NOT NULL AUTO_INCREMENT, \`numero_certificado\` varchar(100) NOT NULL, \`fecha_emision\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_vencimiento\` date NULL, \`url_certificado\` varchar(500) NULL, \`hash_verificacion\` varchar(255) NULL, \`activo\` tinyint NOT NULL DEFAULT '1', \`inscripcion_id\` int NULL, INDEX \`IDX_fb95584eb32fd0fb62e1a80d3b\` (\`hash_verificacion\`), UNIQUE INDEX \`IDX_d7de3909e37252dab1303e34cc\` (\`numero_certificado\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`resenas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`calificacion\` tinyint NOT NULL, \`comentario\` text NULL, \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`activo\` tinyint NOT NULL DEFAULT '1', \`inscripcion_id\` int NULL, INDEX \`IDX_629ef95a8ee77cdf8530145676\` (\`calificacion\`), UNIQUE INDEX \`IDX_c73e35a20d7d4ffd36b0ad6ca1\` (\`inscripcion_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`inscripciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`fecha_inscripcion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_inicio\` datetime NULL, \`fecha_finalizacion\` datetime NULL, \`progreso_porcentaje\` decimal(5,2) NOT NULL DEFAULT '0.00', \`estado\` enum ('inscrito', 'en_progreso', 'completado', 'abandonado') NOT NULL DEFAULT 'inscrito', \`calificacion_final\` decimal(5,2) NULL, \`aprobado\` tinyint NULL, \`capacitacion_id\` int NULL, \`estudiante_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`progreso_lecciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`completada\` tinyint NOT NULL DEFAULT '0', \`fecha_inicio\` datetime NULL, \`fecha_completada\` datetime NULL, \`tiempo_dedicado_minutos\` int NOT NULL DEFAULT '0', \`inscripcion_id\` int NULL, \`leccion_id\` int NULL, UNIQUE INDEX \`IDX_0b03b3ea485b88a02f3a4045a6\` (\`inscripcion_id\`, \`leccion_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`lecciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`titulo\` varchar(300) NOT NULL, \`descripcion\` text NULL, \`contenido\` longtext NULL, \`video_url\` varchar(500) NULL, \`duracion_minutos\` int NULL, \`orden\` int NOT NULL DEFAULT '0', \`activo\` tinyint NOT NULL DEFAULT '1', \`seccion_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`secciones_capacitacion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`titulo\` varchar(300) NOT NULL, \`descripcion\` text NULL, \`orden\` int NOT NULL DEFAULT '0', \`activo\` tinyint NOT NULL DEFAULT '1', \`capacitacion_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`capacitaciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`titulo\` varchar(500) NOT NULL, \`descripcion\` text NULL, \`area_id\` int NULL, \`publico_objetivo\` varchar(200) NULL, \`fecha_inicio\` date NULL, \`fecha_fin\` date NULL, \`duracion_horas\` decimal(5,2) NULL, \`capacidad_maxima\` int NULL, \`imagen_portada_url\` varchar(500) NULL, \`video_promocional_url\` varchar(500) NULL, \`minimo_aprobacion\` decimal(5,2) NOT NULL DEFAULT '70.00', \`porcentaje_eficacia\` decimal(5,2) NULL, \`estado\` enum ('borrador', 'publicada', 'en_curso', 'finalizada', 'cancelada') NOT NULL DEFAULT 'borrador', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`usuario_creacion\` varchar(50) NOT NULL, \`usuario_actualizacion\` varchar(50) NULL, \`tipo_capacitacion_id\` int NULL, \`modalidad_id\` int NULL, \`instructor_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(50) NOT NULL, \`codigo\` varchar(50) NOT NULL, \`descripcion\` text NULL, \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a5be7aa67e759e347b1c6464e1\` (\`nombre\`), UNIQUE INDEX \`IDX_5def9cb8b6a53b45e58ab82e37\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`persona_roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_asignacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`persona_id\` int NULL, \`rol_id\` int NULL, INDEX \`IDX_ee6b48ef7d7671a0c95c19b6d2\` (\`activo\`), UNIQUE INDEX \`IDX_ff10dff62bf37bfb4be9e95ebb\` (\`persona_id\`, \`rol_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`personas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`numero_documento\` varchar(50) NOT NULL, \`tipo_documento\` varchar(20) NOT NULL DEFAULT 'CC', \`nombres\` varchar(200) NOT NULL, \`apellidos\` varchar(200) NOT NULL, \`email\` varchar(255) NULL, \`telefono\` varchar(50) NULL, \`fecha_nacimiento\` date NULL, \`genero\` enum ('M', 'F', 'O') NULL, \`direccion\` text NULL, \`foto_url\` varchar(500) NULL, \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_6019651944f62d09f56ff66f60\` (\`email\`), INDEX \`IDX_fb7a291b1ba766f4575c273947\` (\`activo\`), UNIQUE INDEX \`IDX_8636062e926a684e8e3a58d50a\` (\`numero_documento\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`usuarios\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(100) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`activo\` tinyint NOT NULL DEFAULT '1', \`ultimo_acceso\` datetime NULL, \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`persona_id\` int NOT NULL, \`rol_principal_id\` int NULL, UNIQUE INDEX \`IDX_9f78cfde576fc28f279e2b7a9c\` (\`username\`), UNIQUE INDEX \`REL_899199fd151861c079720cc508\` (\`persona_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`alumnos\` ADD CONSTRAINT \`FK_81923965e846ea6bc6b1ae7a42a\` FOREIGN KEY (\`persona_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`instructores\` ADD CONSTRAINT \`FK_37d658e0238dd3373fa1c35dbfe\` FOREIGN KEY (\`persona_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`materiales_capacitacion\` ADD CONSTRAINT \`FK_7a155638d48a7dd59801d5b3b92\` FOREIGN KEY (\`capacitacion_id\`) REFERENCES \`capacitaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`materiales_capacitacion\` ADD CONSTRAINT \`FK_d969013eb90c7257f712060a92f\` FOREIGN KEY (\`tipo_material_id\`) REFERENCES \`tipos_material\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`respuestas_multiples\` ADD CONSTRAINT \`FK_809e2be0e4f78a0dd33b248c38a\` FOREIGN KEY (\`respuesta_estudiante_id\`) REFERENCES \`respuestas_estudiante\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`respuestas_multiples\` ADD CONSTRAINT \`FK_fe843db46ca7de035805dc649b3\` FOREIGN KEY (\`opcion_respuesta_id\`) REFERENCES \`opciones_respuesta\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`respuestas_estudiante\` ADD CONSTRAINT \`FK_933ac30bc73f767201f1aa14eb7\` FOREIGN KEY (\`intento_evaluacion_id\`) REFERENCES \`intentos_evaluacion\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`respuestas_estudiante\` ADD CONSTRAINT \`FK_18491c2b698edec91d57dbba829\` FOREIGN KEY (\`pregunta_id\`) REFERENCES \`preguntas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`respuestas_estudiante\` ADD CONSTRAINT \`FK_180854391810f88633faa7ed06f\` FOREIGN KEY (\`opcion_respuesta_id\`) REFERENCES \`opciones_respuesta\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`opciones_respuesta\` ADD CONSTRAINT \`FK_98273b41b21b2d39ba4453b75c5\` FOREIGN KEY (\`pregunta_id\`) REFERENCES \`preguntas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`preguntas\` ADD CONSTRAINT \`FK_e11068e3c60eff07d7e5ded1f32\` FOREIGN KEY (\`evaluacion_id\`) REFERENCES \`evaluaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`preguntas\` ADD CONSTRAINT \`FK_b6009bb1fa4ac6832859c506728\` FOREIGN KEY (\`tipo_pregunta_id\`) REFERENCES \`tipos_pregunta\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`evaluaciones\` ADD CONSTRAINT \`FK_9913103701a0edab952146923bb\` FOREIGN KEY (\`capacitacion_id\`) REFERENCES \`capacitaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intentos_evaluacion\` ADD CONSTRAINT \`FK_ccbcfebd0ce1006cc1f3755ad41\` FOREIGN KEY (\`evaluacion_id\`) REFERENCES \`evaluaciones\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`intentos_evaluacion\` ADD CONSTRAINT \`FK_00ebb55f45e53e5fc118d7f69a2\` FOREIGN KEY (\`inscripcion_id\`) REFERENCES \`inscripciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` ADD CONSTRAINT \`FK_23587f49c9b7c00b9a25b5ca305\` FOREIGN KEY (\`inscripcion_id\`) REFERENCES \`inscripciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`resenas\` ADD CONSTRAINT \`FK_c73e35a20d7d4ffd36b0ad6ca14\` FOREIGN KEY (\`inscripcion_id\`) REFERENCES \`inscripciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`inscripciones\` ADD CONSTRAINT \`FK_4bd45e403a2f358897e1b86beaf\` FOREIGN KEY (\`capacitacion_id\`) REFERENCES \`capacitaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`inscripciones\` ADD CONSTRAINT \`FK_562e7adc0f4986a76bfc4243bc7\` FOREIGN KEY (\`estudiante_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`progreso_lecciones\` ADD CONSTRAINT \`FK_d0c5d6f893e27173ee12f2e79d8\` FOREIGN KEY (\`inscripcion_id\`) REFERENCES \`inscripciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`progreso_lecciones\` ADD CONSTRAINT \`FK_068b8b0a7bb3adeda392c482dc1\` FOREIGN KEY (\`leccion_id\`) REFERENCES \`lecciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`lecciones\` ADD CONSTRAINT \`FK_2f9c1cc8656298c74fb6d8b96b8\` FOREIGN KEY (\`seccion_id\`) REFERENCES \`secciones_capacitacion\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`secciones_capacitacion\` ADD CONSTRAINT \`FK_2c690f829a5eb75f1b331e9a955\` FOREIGN KEY (\`capacitacion_id\`) REFERENCES \`capacitaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` ADD CONSTRAINT \`FK_23c50e36d6c32a1fc1cdb5db751\` FOREIGN KEY (\`tipo_capacitacion_id\`) REFERENCES \`tipos_capacitacion\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` ADD CONSTRAINT \`FK_f5921ea5b271fa68cd01145013f\` FOREIGN KEY (\`modalidad_id\`) REFERENCES \`modalidades_capacitacion\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` ADD CONSTRAINT \`FK_e112e5945d2de513bb0c31b7f6f\` FOREIGN KEY (\`instructor_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`persona_roles\` ADD CONSTRAINT \`FK_24baee3672baf9f50e417771c4a\` FOREIGN KEY (\`persona_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`persona_roles\` ADD CONSTRAINT \`FK_f9856f160b8d2c8e16f4a0fef99\` FOREIGN KEY (\`rol_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD CONSTRAINT \`FK_899199fd151861c079720cc508f\` FOREIGN KEY (\`persona_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD CONSTRAINT \`FK_823ed526dc93b2a6334546d7735\` FOREIGN KEY (\`rol_principal_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP FOREIGN KEY \`FK_823ed526dc93b2a6334546d7735\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP FOREIGN KEY \`FK_899199fd151861c079720cc508f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`persona_roles\` DROP FOREIGN KEY \`FK_f9856f160b8d2c8e16f4a0fef99\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`persona_roles\` DROP FOREIGN KEY \`FK_24baee3672baf9f50e417771c4a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` DROP FOREIGN KEY \`FK_e112e5945d2de513bb0c31b7f6f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` DROP FOREIGN KEY \`FK_f5921ea5b271fa68cd01145013f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`capacitaciones\` DROP FOREIGN KEY \`FK_23c50e36d6c32a1fc1cdb5db751\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`secciones_capacitacion\` DROP FOREIGN KEY \`FK_2c690f829a5eb75f1b331e9a955\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`lecciones\` DROP FOREIGN KEY \`FK_2f9c1cc8656298c74fb6d8b96b8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`progreso_lecciones\` DROP FOREIGN KEY \`FK_068b8b0a7bb3adeda392c482dc1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`progreso_lecciones\` DROP FOREIGN KEY \`FK_d0c5d6f893e27173ee12f2e79d8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`inscripciones\` DROP FOREIGN KEY \`FK_562e7adc0f4986a76bfc4243bc7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`inscripciones\` DROP FOREIGN KEY \`FK_4bd45e403a2f358897e1b86beaf\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`resenas\` DROP FOREIGN KEY \`FK_c73e35a20d7d4ffd36b0ad6ca14\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificados\` DROP FOREIGN KEY \`FK_23587f49c9b7c00b9a25b5ca305\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intentos_evaluacion\` DROP FOREIGN KEY \`FK_00ebb55f45e53e5fc118d7f69a2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`intentos_evaluacion\` DROP FOREIGN KEY \`FK_ccbcfebd0ce1006cc1f3755ad41\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`evaluaciones\` DROP FOREIGN KEY \`FK_9913103701a0edab952146923bb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`preguntas\` DROP FOREIGN KEY \`FK_b6009bb1fa4ac6832859c506728\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`preguntas\` DROP FOREIGN KEY \`FK_e11068e3c60eff07d7e5ded1f32\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`opciones_respuesta\` DROP FOREIGN KEY \`FK_98273b41b21b2d39ba4453b75c5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`respuestas_estudiante\` DROP FOREIGN KEY \`FK_180854391810f88633faa7ed06f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`respuestas_estudiante\` DROP FOREIGN KEY \`FK_18491c2b698edec91d57dbba829\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`respuestas_estudiante\` DROP FOREIGN KEY \`FK_933ac30bc73f767201f1aa14eb7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`respuestas_multiples\` DROP FOREIGN KEY \`FK_fe843db46ca7de035805dc649b3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`respuestas_multiples\` DROP FOREIGN KEY \`FK_809e2be0e4f78a0dd33b248c38a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`materiales_capacitacion\` DROP FOREIGN KEY \`FK_d969013eb90c7257f712060a92f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`materiales_capacitacion\` DROP FOREIGN KEY \`FK_7a155638d48a7dd59801d5b3b92\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`instructores\` DROP FOREIGN KEY \`FK_37d658e0238dd3373fa1c35dbfe\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`alumnos\` DROP FOREIGN KEY \`FK_81923965e846ea6bc6b1ae7a42a\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_899199fd151861c079720cc508\` ON \`usuarios\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9f78cfde576fc28f279e2b7a9c\` ON \`usuarios\``,
    );
    await queryRunner.query(`DROP TABLE \`usuarios\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8636062e926a684e8e3a58d50a\` ON \`personas\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fb7a291b1ba766f4575c273947\` ON \`personas\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6019651944f62d09f56ff66f60\` ON \`personas\``,
    );
    await queryRunner.query(`DROP TABLE \`personas\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_ff10dff62bf37bfb4be9e95ebb\` ON \`persona_roles\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_ee6b48ef7d7671a0c95c19b6d2\` ON \`persona_roles\``,
    );
    await queryRunner.query(`DROP TABLE \`persona_roles\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_5def9cb8b6a53b45e58ab82e37\` ON \`roles\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a5be7aa67e759e347b1c6464e1\` ON \`roles\``,
    );
    await queryRunner.query(`DROP TABLE \`roles\``);
    await queryRunner.query(`DROP TABLE \`capacitaciones\``);
    await queryRunner.query(`DROP TABLE \`secciones_capacitacion\``);
    await queryRunner.query(`DROP TABLE \`lecciones\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_0b03b3ea485b88a02f3a4045a6\` ON \`progreso_lecciones\``,
    );
    await queryRunner.query(`DROP TABLE \`progreso_lecciones\``);
    await queryRunner.query(`DROP TABLE \`inscripciones\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c73e35a20d7d4ffd36b0ad6ca1\` ON \`resenas\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_629ef95a8ee77cdf8530145676\` ON \`resenas\``,
    );
    await queryRunner.query(`DROP TABLE \`resenas\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_d7de3909e37252dab1303e34cc\` ON \`certificados\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fb95584eb32fd0fb62e1a80d3b\` ON \`certificados\``,
    );
    await queryRunner.query(`DROP TABLE \`certificados\``);
    await queryRunner.query(`DROP TABLE \`intentos_evaluacion\``);
    await queryRunner.query(`DROP TABLE \`evaluaciones\``);
    await queryRunner.query(`DROP TABLE \`preguntas\``);
    await queryRunner.query(`DROP TABLE \`opciones_respuesta\``);
    await queryRunner.query(`DROP TABLE \`respuestas_estudiante\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_ec1f5a65dbec68dca47316fe9c\` ON \`respuestas_multiples\``,
    );
    await queryRunner.query(`DROP TABLE \`respuestas_multiples\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_d5c17199022eb4a2def526b504\` ON \`tipos_pregunta\``,
    );
    await queryRunner.query(`DROP TABLE \`tipos_pregunta\``);
    await queryRunner.query(`DROP TABLE \`materiales_capacitacion\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_9d5b5f0539bf38ef94057247d9\` ON \`tipos_material\``,
    );
    await queryRunner.query(`DROP TABLE \`tipos_material\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_5147a1f9834ea887b6ad079f5b\` ON \`modalidades_capacitacion\``,
    );
    await queryRunner.query(`DROP TABLE \`modalidades_capacitacion\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_14199ab69b3551092772c55223\` ON \`tipos_capacitacion\``,
    );
    await queryRunner.query(`DROP TABLE \`tipos_capacitacion\``);
    await queryRunner.query(
      `DROP INDEX \`REL_37d658e0238dd3373fa1c35dbf\` ON \`instructores\``,
    );
    await queryRunner.query(`DROP TABLE \`instructores\``);
    await queryRunner.query(
      `DROP INDEX \`REL_81923965e846ea6bc6b1ae7a42\` ON \`alumnos\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1c4bf20b7f94e724088a4c9867\` ON \`alumnos\``,
    );
    await queryRunner.query(`DROP TABLE \`alumnos\``);
  }
}
