import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1766002125586 implements MigrationInterface {
    name = 'InitialSchema1766002125586'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(50) NOT NULL, \`codigo\` varchar(50) NOT NULL, \`descripcion\` text NULL, \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a5be7aa67e759e347b1c6464e1\` (\`nombre\`), UNIQUE INDEX \`IDX_5def9cb8b6a53b45e58ab82e37\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`persona_roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_asignacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`persona_id\` int NULL, \`rol_id\` int NULL, INDEX \`IDX_ee6b48ef7d7671a0c95c19b6d2\` (\`activo\`), UNIQUE INDEX \`IDX_ff10dff62bf37bfb4be9e95ebb\` (\`persona_id\`, \`rol_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`personas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`numero_documento\` varchar(50) NOT NULL, \`tipo_documento\` varchar(20) NOT NULL DEFAULT 'CC', \`nombres\` varchar(200) NOT NULL, \`apellidos\` varchar(200) NOT NULL, \`email\` varchar(255) NULL, \`telefono\` varchar(50) NULL, \`fecha_nacimiento\` date NULL, \`genero\` enum ('M', 'F', 'O') NULL, \`direccion\` text NULL, \`foto_url\` varchar(500) NULL, \`activo\` tinyint NOT NULL DEFAULT '1', \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_6019651944f62d09f56ff66f60\` (\`email\`), INDEX \`IDX_fb7a291b1ba766f4575c273947\` (\`activo\`), UNIQUE INDEX \`IDX_8636062e926a684e8e3a58d50a\` (\`numero_documento\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`usuarios\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(100) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`activo\` tinyint NOT NULL DEFAULT '1', \`ultimo_acceso\` datetime NULL, \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`persona_id\` int NOT NULL, \`rol_principal_id\` int NULL, UNIQUE INDEX \`IDX_9f78cfde576fc28f279e2b7a9c\` (\`username\`), UNIQUE INDEX \`REL_899199fd151861c079720cc508\` (\`persona_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`alumnos\` ADD CONSTRAINT \`FK_81923965e846ea6bc6b1ae7a42a\` FOREIGN KEY (\`persona_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`instructores\` ADD CONSTRAINT \`FK_37d658e0238dd3373fa1c35dbfe\` FOREIGN KEY (\`persona_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`materiales_capacitacion\` ADD CONSTRAINT \`FK_7a155638d48a7dd59801d5b3b92\` FOREIGN KEY (\`capacitacion_id\`) REFERENCES \`capacitaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`materiales_capacitacion\` ADD CONSTRAINT \`FK_d969013eb90c7257f712060a92f\` FOREIGN KEY (\`tipo_material_id\`) REFERENCES \`tipos_material\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`respuestas_multiples\` ADD CONSTRAINT \`FK_809e2be0e4f78a0dd33b248c38a\` FOREIGN KEY (\`respuesta_estudiante_id\`) REFERENCES \`respuestas_estudiante\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`respuestas_multiples\` ADD CONSTRAINT \`FK_fe843db46ca7de035805dc649b3\` FOREIGN KEY (\`opcion_respuesta_id\`) REFERENCES \`opciones_respuesta\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`respuestas_estudiante\` ADD CONSTRAINT \`FK_933ac30bc73f767201f1aa14eb7\` FOREIGN KEY (\`intento_evaluacion_id\`) REFERENCES \`intentos_evaluacion\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`respuestas_estudiante\` ADD CONSTRAINT \`FK_18491c2b698edec91d57dbba829\` FOREIGN KEY (\`pregunta_id\`) REFERENCES \`preguntas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`respuestas_estudiante\` ADD CONSTRAINT \`FK_180854391810f88633faa7ed06f\` FOREIGN KEY (\`opcion_respuesta_id\`) REFERENCES \`opciones_respuesta\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`opciones_respuesta\` ADD CONSTRAINT \`FK_98273b41b21b2d39ba4453b75c5\` FOREIGN KEY (\`pregunta_id\`) REFERENCES \`preguntas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`preguntas\` ADD CONSTRAINT \`FK_e11068e3c60eff07d7e5ded1f32\` FOREIGN KEY (\`evaluacion_id\`) REFERENCES \`evaluaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`preguntas\` ADD CONSTRAINT \`FK_b6009bb1fa4ac6832859c506728\` FOREIGN KEY (\`tipo_pregunta_id\`) REFERENCES \`tipos_pregunta\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`evaluaciones\` ADD CONSTRAINT \`FK_9913103701a0edab952146923bb\` FOREIGN KEY (\`capacitacion_id\`) REFERENCES \`capacitaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`intentos_evaluacion\` ADD CONSTRAINT \`FK_ccbcfebd0ce1006cc1f3755ad41\` FOREIGN KEY (\`evaluacion_id\`) REFERENCES \`evaluaciones\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`intentos_evaluacion\` ADD CONSTRAINT \`FK_00ebb55f45e53e5fc118d7f69a2\` FOREIGN KEY (\`inscripcion_id\`) REFERENCES \`inscripciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`certificados\` ADD CONSTRAINT \`FK_23587f49c9b7c00b9a25b5ca305\` FOREIGN KEY (\`inscripcion_id\`) REFERENCES \`inscripciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reseñas\` ADD CONSTRAINT \`FK_f008f77e1855f90056d6d1701e8\` FOREIGN KEY (\`inscripcion_id\`) REFERENCES \`inscripciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`inscripciones\` ADD CONSTRAINT \`FK_4bd45e403a2f358897e1b86beaf\` FOREIGN KEY (\`capacitacion_id\`) REFERENCES \`capacitaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`inscripciones\` ADD CONSTRAINT \`FK_562e7adc0f4986a76bfc4243bc7\` FOREIGN KEY (\`estudiante_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`progreso_lecciones\` ADD CONSTRAINT \`FK_d0c5d6f893e27173ee12f2e79d8\` FOREIGN KEY (\`inscripcion_id\`) REFERENCES \`inscripciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`progreso_lecciones\` ADD CONSTRAINT \`FK_068b8b0a7bb3adeda392c482dc1\` FOREIGN KEY (\`leccion_id\`) REFERENCES \`lecciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`lecciones\` ADD CONSTRAINT \`FK_2f9c1cc8656298c74fb6d8b96b8\` FOREIGN KEY (\`seccion_id\`) REFERENCES \`secciones_capacitacion\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`secciones_capacitacion\` ADD CONSTRAINT \`FK_2c690f829a5eb75f1b331e9a955\` FOREIGN KEY (\`capacitacion_id\`) REFERENCES \`capacitaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`capacitaciones\` ADD CONSTRAINT \`FK_23c50e36d6c32a1fc1cdb5db751\` FOREIGN KEY (\`tipo_capacitacion_id\`) REFERENCES \`tipos_capacitacion\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`capacitaciones\` ADD CONSTRAINT \`FK_f5921ea5b271fa68cd01145013f\` FOREIGN KEY (\`modalidad_id\`) REFERENCES \`modalidades_capacitacion\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`capacitaciones\` ADD CONSTRAINT \`FK_e112e5945d2de513bb0c31b7f6f\` FOREIGN KEY (\`instructor_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`persona_roles\` ADD CONSTRAINT \`FK_24baee3672baf9f50e417771c4a\` FOREIGN KEY (\`persona_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`persona_roles\` ADD CONSTRAINT \`FK_f9856f160b8d2c8e16f4a0fef99\` FOREIGN KEY (\`rol_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`usuarios\` ADD CONSTRAINT \`FK_899199fd151861c079720cc508f\` FOREIGN KEY (\`persona_id\`) REFERENCES \`personas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`usuarios\` ADD CONSTRAINT \`FK_823ed526dc93b2a6334546d7735\` FOREIGN KEY (\`rol_principal_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`usuarios\` DROP FOREIGN KEY \`FK_823ed526dc93b2a6334546d7735\``);
        await queryRunner.query(`ALTER TABLE \`usuarios\` DROP FOREIGN KEY \`FK_899199fd151861c079720cc508f\``);
        await queryRunner.query(`ALTER TABLE \`persona_roles\` DROP FOREIGN KEY \`FK_f9856f160b8d2c8e16f4a0fef99\``);
        await queryRunner.query(`ALTER TABLE \`persona_roles\` DROP FOREIGN KEY \`FK_24baee3672baf9f50e417771c4a\``);
        await queryRunner.query(`ALTER TABLE \`capacitaciones\` DROP FOREIGN KEY \`FK_e112e5945d2de513bb0c31b7f6f\``);
        await queryRunner.query(`ALTER TABLE \`capacitaciones\` DROP FOREIGN KEY \`FK_f5921ea5b271fa68cd01145013f\``);
        await queryRunner.query(`ALTER TABLE \`capacitaciones\` DROP FOREIGN KEY \`FK_23c50e36d6c32a1fc1cdb5db751\``);
        await queryRunner.query(`ALTER TABLE \`secciones_capacitacion\` DROP FOREIGN KEY \`FK_2c690f829a5eb75f1b331e9a955\``);
        await queryRunner.query(`ALTER TABLE \`lecciones\` DROP FOREIGN KEY \`FK_2f9c1cc8656298c74fb6d8b96b8\``);
        await queryRunner.query(`ALTER TABLE \`progreso_lecciones\` DROP FOREIGN KEY \`FK_068b8b0a7bb3adeda392c482dc1\``);
        await queryRunner.query(`ALTER TABLE \`progreso_lecciones\` DROP FOREIGN KEY \`FK_d0c5d6f893e27173ee12f2e79d8\``);
        await queryRunner.query(`ALTER TABLE \`inscripciones\` DROP FOREIGN KEY \`FK_562e7adc0f4986a76bfc4243bc7\``);
        await queryRunner.query(`ALTER TABLE \`inscripciones\` DROP FOREIGN KEY \`FK_4bd45e403a2f358897e1b86beaf\``);
        await queryRunner.query(`ALTER TABLE \`reseñas\` DROP FOREIGN KEY \`FK_f008f77e1855f90056d6d1701e8\``);
        await queryRunner.query(`ALTER TABLE \`certificados\` DROP FOREIGN KEY \`FK_23587f49c9b7c00b9a25b5ca305\``);
        await queryRunner.query(`ALTER TABLE \`intentos_evaluacion\` DROP FOREIGN KEY \`FK_00ebb55f45e53e5fc118d7f69a2\``);
        await queryRunner.query(`ALTER TABLE \`intentos_evaluacion\` DROP FOREIGN KEY \`FK_ccbcfebd0ce1006cc1f3755ad41\``);
        await queryRunner.query(`ALTER TABLE \`evaluaciones\` DROP FOREIGN KEY \`FK_9913103701a0edab952146923bb\``);
        await queryRunner.query(`ALTER TABLE \`preguntas\` DROP FOREIGN KEY \`FK_b6009bb1fa4ac6832859c506728\``);
        await queryRunner.query(`ALTER TABLE \`preguntas\` DROP FOREIGN KEY \`FK_e11068e3c60eff07d7e5ded1f32\``);
        await queryRunner.query(`ALTER TABLE \`opciones_respuesta\` DROP FOREIGN KEY \`FK_98273b41b21b2d39ba4453b75c5\``);
        await queryRunner.query(`ALTER TABLE \`respuestas_estudiante\` DROP FOREIGN KEY \`FK_180854391810f88633faa7ed06f\``);
        await queryRunner.query(`ALTER TABLE \`respuestas_estudiante\` DROP FOREIGN KEY \`FK_18491c2b698edec91d57dbba829\``);
        await queryRunner.query(`ALTER TABLE \`respuestas_estudiante\` DROP FOREIGN KEY \`FK_933ac30bc73f767201f1aa14eb7\``);
        await queryRunner.query(`ALTER TABLE \`respuestas_multiples\` DROP FOREIGN KEY \`FK_fe843db46ca7de035805dc649b3\``);
        await queryRunner.query(`ALTER TABLE \`respuestas_multiples\` DROP FOREIGN KEY \`FK_809e2be0e4f78a0dd33b248c38a\``);
        await queryRunner.query(`ALTER TABLE \`materiales_capacitacion\` DROP FOREIGN KEY \`FK_d969013eb90c7257f712060a92f\``);
        await queryRunner.query(`ALTER TABLE \`materiales_capacitacion\` DROP FOREIGN KEY \`FK_7a155638d48a7dd59801d5b3b92\``);
        await queryRunner.query(`ALTER TABLE \`instructores\` DROP FOREIGN KEY \`FK_37d658e0238dd3373fa1c35dbfe\``);
        await queryRunner.query(`ALTER TABLE \`alumnos\` DROP FOREIGN KEY \`FK_81923965e846ea6bc6b1ae7a42a\``);
        await queryRunner.query(`DROP INDEX \`REL_899199fd151861c079720cc508\` ON \`usuarios\``);
        await queryRunner.query(`DROP INDEX \`IDX_9f78cfde576fc28f279e2b7a9c\` ON \`usuarios\``);
        await queryRunner.query(`DROP TABLE \`usuarios\``);
        await queryRunner.query(`DROP INDEX \`IDX_8636062e926a684e8e3a58d50a\` ON \`personas\``);
        await queryRunner.query(`DROP INDEX \`IDX_fb7a291b1ba766f4575c273947\` ON \`personas\``);
        await queryRunner.query(`DROP INDEX \`IDX_6019651944f62d09f56ff66f60\` ON \`personas\``);
        await queryRunner.query(`DROP TABLE \`personas\``);
        await queryRunner.query(`DROP INDEX \`IDX_ff10dff62bf37bfb4be9e95ebb\` ON \`persona_roles\``);
        await queryRunner.query(`DROP INDEX \`IDX_ee6b48ef7d7671a0c95c19b6d2\` ON \`persona_roles\``);
        await queryRunner.query(`DROP TABLE \`persona_roles\``);
        await queryRunner.query(`DROP INDEX \`IDX_5def9cb8b6a53b45e58ab82e37\` ON \`roles\``);
        await queryRunner.query(`DROP INDEX \`IDX_a5be7aa67e759e347b1c6464e1\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
    }

}
