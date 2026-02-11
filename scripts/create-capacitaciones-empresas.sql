-- Crear tabla capacitaciones_empresas (cursos asignados a empresas por el admin).
-- Ejecutar en la base de datos donde corre la app (ej. formar360_training_prod) si la migración no se ha corrido.
-- Uso: mysql -u usuario -p nombre_bd < scripts/create-capacitaciones-empresas.sql

CREATE TABLE IF NOT EXISTS `capacitaciones_empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `capacitacion_id` int NOT NULL,
  `fecha_asignacion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_empresa_capacitacion` (`empresa_id`, `capacitacion_id`),
  CONSTRAINT `FK_capacitaciones_empresas_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_capacitaciones_empresas_capacitacion` FOREIGN KEY (`capacitacion_id`) REFERENCES `capacitaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
