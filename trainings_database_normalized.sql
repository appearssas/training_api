-- =====================================================
-- BASE DE DATOS NORMALIZADA PARA SISTEMA DE CAPACITACIONES
-- Tipo Udemy: Capacitaciones, Evaluaciones, Certificados
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- =====================================================
-- TABLAS MAESTRAS / CATÁLOGOS
-- =====================================================

-- Tipos de capacitación
CREATE TABLE `tipos_capacitacion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL COMMENT 'Estándar, Certificada, Encuesta',
  `codigo` VARCHAR(20) NOT NULL UNIQUE,
  `descripcion` TEXT,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modalidades de capacitación
CREATE TABLE `modalidades_capacitacion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL COMMENT 'Online, Presencial, Mixta',
  `codigo` VARCHAR(20) NOT NULL UNIQUE,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tipos de preguntas (para evaluaciones)
CREATE TABLE `tipos_pregunta` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL COMMENT 'Selección única, Múltiple, Abierta, Verdadero/Falso, etc.',
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `permite_multiple_respuesta` TINYINT(1) NOT NULL DEFAULT 0,
  `requiere_texto_libre` TINYINT(1) NOT NULL DEFAULT 0,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tipos de adjuntos/materiales
CREATE TABLE `tipos_material` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL COMMENT 'Archivo PDF, Video, Link externo, Imagen, etc.',
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ROLES Y PERMISOS
-- =====================================================

-- Roles del sistema (catálogo)
CREATE TABLE `roles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL UNIQUE COMMENT 'admin, instructor, alumno',
  `codigo` VARCHAR(50) NOT NULL UNIQUE COMMENT 'ADMIN, INSTRUCTOR, ALUMNO',
  `descripcion` TEXT,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PERSONAS Y USUARIOS
-- =====================================================

-- Personas (tabla principal)
CREATE TABLE `personas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `numero_documento` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Número de documento único',
  `tipo_documento` VARCHAR(20) DEFAULT 'CC' COMMENT 'CC, CE, NIT, etc.',
  `nombres` VARCHAR(200) NOT NULL,
  `apellidos` VARCHAR(200) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `telefono` VARCHAR(50) DEFAULT NULL,
  `fecha_nacimiento` DATE DEFAULT NULL,
  `genero` ENUM('M', 'F', 'O') DEFAULT NULL,
  `direccion` TEXT,
  `foto_url` VARCHAR(500) DEFAULT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_num_doc` (`numero_documento`),
  INDEX `idx_email` (`email`),
  INDEX `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuarios (OBLIGATORIO: una persona DEBE tener un usuario para acceder al sistema)
CREATE TABLE `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `persona_id` INT(11) NOT NULL COMMENT 'FK a personas (OBLIGATORIO)',
  `username` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Nombre de usuario para login',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hash de la contraseña',
  `rol_principal_id` INT(11) DEFAULT NULL COMMENT 'FK a roles - Rol principal/por defecto',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `ultimo_acceso` DATETIME DEFAULT NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_persona_usuario` (`persona_id`),
  INDEX `idx_rol_principal` (`rol_principal_id`),
  CONSTRAINT `fk_usr_persona` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_usr_rol_principal` FOREIGN KEY (`rol_principal_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles asignados a personas (muchos a muchos)
-- Permite que una persona tenga múltiples roles (ej: instructor Y alumno)
CREATE TABLE `persona_roles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `persona_id` INT(11) NOT NULL COMMENT 'FK a personas',
  `rol_id` INT(11) NOT NULL COMMENT 'FK a roles',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_asignacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_persona_rol` (`persona_id`, `rol_id`),
  INDEX `idx_rol` (`rol_id`),
  INDEX `idx_activo` (`activo`),
  CONSTRAINT `fk_pr_persona` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pr_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alumnos (datos específicos del rol ALUMNO)
-- NOTA: Una persona debe tener el rol 'ALUMNO' en persona_roles para ser considerada alumno
CREATE TABLE `alumnos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `persona_id` INT(11) NOT NULL COMMENT 'FK a personas',
  `codigo_estudiante` VARCHAR(50) DEFAULT NULL UNIQUE COMMENT 'Código único de estudiante',
  `fecha_ingreso` DATE DEFAULT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_persona_alumno` (`persona_id`),
  INDEX `idx_codigo` (`codigo_estudiante`),
  CONSTRAINT `fk_alu_persona` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Instructores (datos específicos del rol INSTRUCTOR)
-- NOTA: Una persona debe tener el rol 'INSTRUCTOR' en persona_roles para ser considerada instructor
CREATE TABLE `instructores` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `persona_id` INT(11) NOT NULL COMMENT 'FK a personas',
  `especialidad` VARCHAR(200) DEFAULT NULL,
  `biografia` TEXT,
  `calificacion_promedio` DECIMAL(3,2) DEFAULT NULL COMMENT 'Calificación promedio del instructor',
  `total_capacitaciones` INT(11) DEFAULT 0 COMMENT 'Total de capacitaciones creadas',
  `total_estudiantes` INT(11) DEFAULT 0 COMMENT 'Total de estudiantes que ha tenido',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_persona_instructor` (`persona_id`),
  CONSTRAINT `fk_ins_persona` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TRIGGERS Y VALIDACIONES
-- =====================================================

-- NOTA: Las siguientes validaciones deben implementarse a nivel de aplicación:
-- 1. Una persona DEBE tener un usuario (obligatorio)
-- 2. Una persona DEBE ser al menos alumno O instructor (obligatorio)

-- =====================================================
-- TRIGGERS Y VALIDACIONES
-- =====================================================

-- NOTA: Las siguientes validaciones deben implementarse a nivel de aplicación:
-- 1. Una persona DEBE tener un usuario (obligatorio)
-- 2. Una persona DEBE tener al menos un rol activo en persona_roles (ALUMNO o INSTRUCTOR)
-- 3. Si una persona tiene rol ALUMNO, debe existir registro en tabla alumnos
-- 4. Si una persona tiene rol INSTRUCTOR, debe existir registro en tabla instructores

-- Trigger para prevenir eliminar el último rol activo de una persona
DELIMITER $$
CREATE TRIGGER `trg_prevenir_eliminar_ultimo_rol` 
BEFORE DELETE ON `persona_roles`
FOR EACH ROW
BEGIN
  DECLARE roles_activos_restantes INT DEFAULT 0;
  
  -- Contar roles activos restantes (excluyendo el que se está eliminando)
  SELECT COUNT(*) INTO roles_activos_restantes
  FROM `persona_roles`
  WHERE `persona_id` = OLD.persona_id 
    AND `id` != OLD.id 
    AND `activo` = 1;
  
  -- Si no quedan roles activos y el rol eliminado era ALUMNO o INSTRUCTOR, prevenir
  IF roles_activos_restantes = 0 THEN
    DECLARE es_alumno_o_instructor INT DEFAULT 0;
    SELECT COUNT(*) INTO es_alumno_o_instructor
    FROM `roles` r
    WHERE r.id = OLD.rol_id 
      AND r.codigo IN ('ALUMNO', 'INSTRUCTOR');
    
    IF es_alumno_o_instructor > 0 THEN
      SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'No se puede eliminar el último rol activo. La persona debe tener al menos un rol activo (ALUMNO o INSTRUCTOR).';
    END IF;
  END IF;
END$$
DELIMITER ;

-- Trigger para prevenir desactivar el último rol activo de una persona
DELIMITER $$
CREATE TRIGGER `trg_prevenir_desactivar_ultimo_rol` 
BEFORE UPDATE ON `persona_roles`
FOR EACH ROW
BEGIN
  DECLARE roles_activos_restantes INT DEFAULT 0;
  
  -- Si se está desactivando un rol
  IF NEW.activo = 0 AND OLD.activo = 1 THEN
    -- Contar otros roles activos
    SELECT COUNT(*) INTO roles_activos_restantes
    FROM `persona_roles`
    WHERE `persona_id` = NEW.persona_id 
      AND `id` != NEW.id 
      AND `activo` = 1;
    
    -- Si no quedan roles activos y el rol desactivado es ALUMNO o INSTRUCTOR, prevenir
    IF roles_activos_restantes = 0 THEN
      DECLARE es_alumno_o_instructor INT DEFAULT 0;
      SELECT COUNT(*) INTO es_alumno_o_instructor
      FROM `roles` r
      WHERE r.id = NEW.rol_id 
        AND r.codigo IN ('ALUMNO', 'INSTRUCTOR');
      
      IF es_alumno_o_instructor > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'No se puede desactivar el último rol activo. La persona debe tener al menos un rol activo (ALUMNO o INSTRUCTOR).';
      END IF;
    END IF;
  END IF;
END$$
DELIMITER ;

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Capacitaciones (cursos)
CREATE TABLE `capacitaciones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(500) NOT NULL,
  `descripcion` TEXT,
  `tipo_capacitacion_id` INT(11) NOT NULL COMMENT 'FK a tipos_capacitacion',
  `modalidad_id` INT(11) NOT NULL COMMENT 'FK a modalidades_capacitacion',
  `instructor_id` INT(11) NOT NULL COMMENT 'FK a personas.id (docente/responsable)',
  `area_id` INT(11) DEFAULT NULL COMMENT 'FK a area.idArea',
  `publico_objetivo` VARCHAR(200) DEFAULT NULL,
  `fecha_inicio` DATE DEFAULT NULL,
  `fecha_fin` DATE DEFAULT NULL,
  `duracion_horas` DECIMAL(5,2) DEFAULT NULL,
  `capacidad_maxima` INT(11) DEFAULT NULL,
  `imagen_portada_url` VARCHAR(500) DEFAULT NULL,
  `video_promocional_url` VARCHAR(500) DEFAULT NULL,
  `minimo_aprobacion` DECIMAL(5,2) DEFAULT 70.00 COMMENT 'Porcentaje mínimo para aprobar',
  `porcentaje_eficacia` DECIMAL(5,2) DEFAULT NULL,
  `estado` ENUM('borrador', 'publicada', 'en_curso', 'finalizada', 'cancelada') NOT NULL DEFAULT 'borrador',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `usuario_creacion` VARCHAR(50) NOT NULL,
  `usuario_actualizacion` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_tipo` (`tipo_capacitacion_id`),
  INDEX `idx_modalidad` (`modalidad_id`),
  INDEX `idx_instructor` (`instructor_id`),
  INDEX `idx_estado` (`estado`),
  CONSTRAINT `fk_cap_tipo` FOREIGN KEY (`tipo_capacitacion_id`) REFERENCES `tipos_capacitacion` (`id`),
  CONSTRAINT `fk_cap_modalidad` FOREIGN KEY (`modalidad_id`) REFERENCES `modalidades_capacitacion` (`id`),
  CONSTRAINT `fk_cap_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `personas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Materiales de apoyo (adjuntos, links, imágenes)
CREATE TABLE `materiales_capacitacion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `capacitacion_id` INT(11) NOT NULL COMMENT 'FK a capacitaciones',
  `tipo_material_id` INT(11) NOT NULL COMMENT 'FK a tipos_material',
  `nombre` VARCHAR(200) NOT NULL,
  `url` VARCHAR(1000) NOT NULL,
  `descripcion` TEXT,
  `orden` INT(11) DEFAULT 0 COMMENT 'Orden de visualización',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_capacitacion` (`capacitacion_id`),
  INDEX `idx_tipo` (`tipo_material_id`),
  CONSTRAINT `fk_mat_cap` FOREIGN KEY (`capacitacion_id`) REFERENCES `capacitaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mat_tipo` FOREIGN KEY (`tipo_material_id`) REFERENCES `tipos_material` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Secciones/Contenido de la capacitación
CREATE TABLE `secciones_capacitacion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `capacitacion_id` INT(11) NOT NULL,
  `titulo` VARCHAR(300) NOT NULL,
  `descripcion` TEXT,
  `orden` INT(11) DEFAULT 0,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_capacitacion` (`capacitacion_id`),
  CONSTRAINT `fk_sec_cap` FOREIGN KEY (`capacitacion_id`) REFERENCES `capacitaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lecciones dentro de secciones
CREATE TABLE `lecciones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `seccion_id` INT(11) NOT NULL,
  `titulo` VARCHAR(300) NOT NULL,
  `descripcion` TEXT,
  `contenido` LONGTEXT COMMENT 'Contenido HTML/Markdown de la lección',
  `video_url` VARCHAR(500) DEFAULT NULL,
  `duracion_minutos` INT(11) DEFAULT NULL,
  `orden` INT(11) DEFAULT 0,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_seccion` (`seccion_id`),
  CONSTRAINT `fk_lec_sec` FOREIGN KEY (`seccion_id`) REFERENCES `secciones_capacitacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EVALUACIONES Y PREGUNTAS
-- =====================================================

-- Evaluaciones asociadas a capacitaciones
CREATE TABLE `evaluaciones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `capacitacion_id` INT(11) NOT NULL,
  `titulo` VARCHAR(300) NOT NULL,
  `descripcion` TEXT,
  `tiempo_limite_minutos` INT(11) DEFAULT NULL COMMENT 'NULL = sin límite',
  `intentos_permitidos` INT(11) DEFAULT 1,
  `mostrar_resultados` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Si muestra resultados al finalizar',
  `mostrar_respuestas_correctas` TINYINT(1) NOT NULL DEFAULT 0,
  `puntaje_total` DECIMAL(10,2) DEFAULT 100.00,
  `minimo_aprobacion` DECIMAL(5,2) DEFAULT 70.00,
  `orden` INT(11) DEFAULT 0,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_capacitacion` (`capacitacion_id`),
  CONSTRAINT `fk_eval_cap` FOREIGN KEY (`capacitacion_id`) REFERENCES `capacitaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preguntas de evaluaciones (soporta cualquier tipo)
CREATE TABLE `preguntas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `evaluacion_id` INT(11) NOT NULL,
  `tipo_pregunta_id` INT(11) NOT NULL,
  `enunciado` TEXT NOT NULL,
  `puntaje` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `orden` INT(11) DEFAULT 0,
  `requerida` TINYINT(1) NOT NULL DEFAULT 1,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_evaluacion` (`evaluacion_id`),
  INDEX `idx_tipo` (`tipo_pregunta_id`),
  CONSTRAINT `fk_preg_eval` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_preg_tipo` FOREIGN KEY (`tipo_pregunta_id`) REFERENCES `tipos_pregunta` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opciones de respuesta (para preguntas de selección)
CREATE TABLE `opciones_respuesta` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `pregunta_id` INT(11) NOT NULL,
  `texto` VARCHAR(1000) NOT NULL,
  `es_correcta` TINYINT(1) NOT NULL DEFAULT 0,
  `puntaje_parcial` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Puntaje si se selecciona esta opción',
  `orden` INT(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_pregunta` (`pregunta_id`),
  CONSTRAINT `fk_opc_preg` FOREIGN KEY (`pregunta_id`) REFERENCES `preguntas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ESTUDIANTES Y PROGRESO
-- =====================================================

-- Inscripciones de estudiantes a capacitaciones
CREATE TABLE `inscripciones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `capacitacion_id` INT(11) NOT NULL,
  `estudiante_id` INT(11) NOT NULL COMMENT 'FK a personas.id',
  `fecha_inscripcion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_inicio` DATETIME DEFAULT NULL COMMENT 'Cuándo empezó a tomar la capacitación',
  `fecha_finalizacion` DATETIME DEFAULT NULL COMMENT 'Cuándo completó la capacitación',
  `progreso_porcentaje` DECIMAL(5,2) DEFAULT 0.00 COMMENT '0-100',
  `estado` ENUM('inscrito', 'en_progreso', 'completado', 'abandonado') NOT NULL DEFAULT 'inscrito',
  `calificacion_final` DECIMAL(5,2) DEFAULT NULL COMMENT 'Calificación final del curso',
  `aprobado` TINYINT(1) DEFAULT NULL COMMENT 'NULL = pendiente, 1 = aprobado, 0 = reprobado',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cap_est` (`capacitacion_id`, `estudiante_id`),
  INDEX `idx_estudiante` (`estudiante_id`),
  INDEX `idx_estado` (`estado`),
  CONSTRAINT `fk_insc_cap` FOREIGN KEY (`capacitacion_id`) REFERENCES `capacitaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_insc_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `personas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Progreso por lección
CREATE TABLE `progreso_lecciones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `inscripcion_id` INT(11) NOT NULL,
  `leccion_id` INT(11) NOT NULL,
  `completada` TINYINT(1) NOT NULL DEFAULT 0,
  `fecha_inicio` DATETIME DEFAULT NULL,
  `fecha_completada` DATETIME DEFAULT NULL,
  `tiempo_dedicado_minutos` INT(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_insc_lec` (`inscripcion_id`, `leccion_id`),
  INDEX `idx_leccion` (`leccion_id`),
  CONSTRAINT `fk_prog_insc` FOREIGN KEY (`inscripcion_id`) REFERENCES `inscripciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prog_lec` FOREIGN KEY (`leccion_id`) REFERENCES `lecciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Intentos de evaluación
CREATE TABLE `intentos_evaluacion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `evaluacion_id` INT(11) NOT NULL,
  `inscripcion_id` INT(11) NOT NULL,
  `numero_intento` INT(11) NOT NULL DEFAULT 1,
  `fecha_inicio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_finalizacion` DATETIME DEFAULT NULL,
  `puntaje_obtenido` DECIMAL(10,2) DEFAULT 0.00,
  `puntaje_total` DECIMAL(10,2) DEFAULT NULL,
  `porcentaje` DECIMAL(5,2) DEFAULT NULL,
  `aprobado` TINYINT(1) DEFAULT NULL,
  `tiempo_utilizado_minutos` INT(11) DEFAULT NULL,
  `estado` ENUM('en_progreso', 'completado', 'abandonado') NOT NULL DEFAULT 'en_progreso',
  PRIMARY KEY (`id`),
  INDEX `idx_evaluacion` (`evaluacion_id`),
  INDEX `idx_inscripcion` (`inscripcion_id`),
  INDEX `idx_estado` (`estado`),
  CONSTRAINT `fk_int_eval` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluaciones` (`id`),
  CONSTRAINT `fk_int_insc` FOREIGN KEY (`inscripcion_id`) REFERENCES `inscripciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Respuestas de estudiantes a preguntas
CREATE TABLE `respuestas_estudiante` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `intento_evaluacion_id` INT(11) NOT NULL,
  `pregunta_id` INT(11) NOT NULL,
  `opcion_respuesta_id` INT(11) DEFAULT NULL COMMENT 'Para preguntas de selección',
  `texto_respuesta` TEXT COMMENT 'Para preguntas abiertas',
  `puntaje_obtenido` DECIMAL(10,2) DEFAULT 0.00,
  `fecha_respuesta` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_intento` (`intento_evaluacion_id`),
  INDEX `idx_pregunta` (`pregunta_id`),
  INDEX `idx_opcion` (`opcion_respuesta_id`),
  CONSTRAINT `fk_rta_intento` FOREIGN KEY (`intento_evaluacion_id`) REFERENCES `intentos_evaluacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rta_preg` FOREIGN KEY (`pregunta_id`) REFERENCES `preguntas` (`id`),
  CONSTRAINT `fk_rta_opc` FOREIGN KEY (`opcion_respuesta_id`) REFERENCES `opciones_respuesta` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Respuestas múltiples (para preguntas que permiten varias opciones)
CREATE TABLE `respuestas_multiples` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `respuesta_estudiante_id` INT(11) NOT NULL,
  `opcion_respuesta_id` INT(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rta_opc` (`respuesta_estudiante_id`, `opcion_respuesta_id`),
  CONSTRAINT `fk_rm_rta` FOREIGN KEY (`respuesta_estudiante_id`) REFERENCES `respuestas_estudiante` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rm_opc` FOREIGN KEY (`opcion_respuesta_id`) REFERENCES `opciones_respuesta` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CERTIFICADOS
-- =====================================================

-- Certificados generados
CREATE TABLE `certificados` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `inscripcion_id` INT(11) NOT NULL,
  `numero_certificado` VARCHAR(100) NOT NULL UNIQUE,
  `fecha_emision` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_vencimiento` DATE DEFAULT NULL,
  `url_certificado` VARCHAR(500) DEFAULT NULL COMMENT 'URL del PDF del certificado',
  `hash_verificacion` VARCHAR(255) DEFAULT NULL COMMENT 'Hash para verificar autenticidad',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_num_cert` (`numero_certificado`),
  INDEX `idx_inscripcion` (`inscripcion_id`),
  INDEX `idx_hash` (`hash_verificacion`),
  CONSTRAINT `fk_cert_insc` FOREIGN KEY (`inscripcion_id`) REFERENCES `inscripciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- RESEÑAS Y CALIFICACIONES
-- =====================================================

-- Reseñas de estudiantes sobre capacitaciones
CREATE TABLE `resenas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `inscripcion_id` INT(11) NOT NULL,
  `calificacion` TINYINT(1) NOT NULL COMMENT '1-5 estrellas',
  `comentario` TEXT,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_insc_resena` (`inscripcion_id`),
  INDEX `idx_calificacion` (`calificacion`),
  CONSTRAINT `fk_res_insc` FOREIGN KEY (`inscripcion_id`) REFERENCES `inscripciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES (INSERTS)
-- =====================================================

-- Roles del sistema
INSERT INTO `roles` (`nombre`, `codigo`, `descripcion`) VALUES
('Administrador', 'ADMIN', 'Administrador del sistema con acceso completo'),
('Instructor', 'INSTRUCTOR', 'Instructor que puede crear y gestionar capacitaciones'),
('Alumno', 'ALUMNO', 'Estudiante que puede inscribirse y tomar capacitaciones');

-- Tipos de capacitación
INSERT INTO `tipos_capacitacion` (`nombre`, `codigo`, `descripcion`) VALUES
('Estándar', 'STANDARD', 'Capacitación regular sin certificación'),
('Certificada', 'CERTIFIED', 'Capacitación que genera certificado'),
('Encuesta', 'SURVEY', 'Encuesta de satisfacción o evaluación');

-- Modalidades
INSERT INTO `modalidades_capacitacion` (`nombre`, `codigo`) VALUES
('Online', 'ONLINE'),
('Presencial', 'ONSITE'),
('Mixta', 'HYBRID');

-- Tipos de pregunta
INSERT INTO `tipos_pregunta` (`nombre`, `codigo`, `permite_multiple_respuesta`, `requiere_texto_libre`) VALUES
('Selección única', 'SINGLE_CHOICE', 0, 0),
('Selección múltiple', 'MULTIPLE_CHOICE', 1, 0),
('Respuesta abierta', 'OPEN_TEXT', 0, 1),
('Verdadero/Falso', 'TRUE_FALSE', 0, 0),
('Completar espacios', 'FILL_BLANKS', 0, 1),
('Emparejamiento', 'MATCHING', 1, 0);

-- Tipos de material
INSERT INTO `tipos_material` (`nombre`, `codigo`) VALUES
('Archivo PDF', 'PDF'),
('Archivo Word', 'DOC'),
('Video', 'VIDEO'),
('Imagen', 'IMAGE'),
('Link externo', 'LINK'),
('Presentación', 'PRESENTATION'),
('Audio', 'AUDIO');
