# Training API

API REST para sistema de capacitaciones tipo Udemy, construida con NestJS y TypeORM.

## Características

- ✅ Sistema completo de capacitaciones con secciones y lecciones
- ✅ Materiales de apoyo (adjuntos, links, imágenes)
- ✅ Evaluaciones flexibles con cualquier tipo de pregunta
- ✅ Seguimiento de progreso de estudiantes
- ✅ Sistema de certificados
- ✅ Reseñas y calificaciones
- ✅ Gestión de personas, usuarios, alumnos e instructores

## Requisitos

- Node.js 18+
- MySQL 5.7+ o MariaDB 10.3+
- Yarn o npm

## Instalación

1. Instalar dependencias:

```bash
yarn install
# o
npm install
```

2. Configurar base de datos:

Copia el archivo `env.example` a `.env` y ajusta las variables:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password
DB_DATABASE=trainings_db
```

3. Crear la base de datos:

```sql
CREATE DATABASE trainings_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Ejecutar el script SQL para crear las tablas:

```bash
mysql -u root -p trainings_db < trainings_database_normalized.sql
```

O importa el archivo `trainings_database_normalized.sql` desde tu cliente MySQL.

## Ejecutar la aplicación

```bash
# Desarrollo
yarn start:dev

# Producción
yarn build
yarn start:prod
```

## Estructura del Proyecto

```
src/
├── entities/           # Entidades TypeORM
│   ├── catalogos/     # Catálogos maestros
│   ├── evaluaciones/  # Entidades de evaluaciones
│   └── ...
├── database/          # Configuración de base de datos
└── app.module.ts      # Módulo principal
```

## Entidades Principales

### Personas, Usuarios y Roles

- **Personas**: Tabla principal con información básica
- **Usuarios**: OBLIGATORIO - Una persona DEBE tener un usuario para acceder al sistema
- **Roles**: Catálogo de roles (ADMIN, INSTRUCTOR, ALUMNO)
- **Persona Roles**: Relación muchos a muchos - permite múltiples roles por persona
- **Alumnos**: Tabla con datos específicos del rol ALUMNO (código_estudiante, fecha_ingreso)
- **Instructores**: Tabla con datos específicos del rol INSTRUCTOR (especialidad, biografía, estadísticas)

**Sistema Híbrido de Roles:**

- ✅ **Roles** para permisos y acceso (tabla `roles` + `persona_roles`)
- ✅ **Tablas específicas** para datos del rol (`alumnos`, `instructores`)
- ✅ Permite que una persona tenga múltiples roles simultáneamente

**Reglas de negocio:**

- ✅ Una persona DEBE tener un usuario (obligatorio)
- ✅ Una persona DEBE tener al menos un rol activo en `persona_roles` (ALUMNO o INSTRUCTOR)
- ✅ Si una persona tiene rol ALUMNO, debe existir registro en tabla `alumnos`
- ✅ Si una persona tiene rol INSTRUCTOR, debe existir registro en tabla `instructores`
- ✅ Una persona puede ser tanto alumno como instructor simultáneamente

**Ver documentación completa:** Ver `ROLES_DESIGN.md` para detalles del diseño del sistema de roles.

### Capacitaciones

- **Capacitaciones**: Cursos con instructor, área, fechas, etc.
- **Materiales**: Adjuntos, links, imágenes por capacitación
- **Secciones y Lecciones**: Contenido estructurado
- **Evaluaciones**: Exámenes con preguntas flexibles
- **Inscripciones**: Estudiantes inscritos a capacitaciones
- **Progreso**: Seguimiento de lecciones completadas
- **Certificados**: Certificados generados
- **Reseñas**: Calificaciones y comentarios

## Base de Datos

La base de datos está normalizada y soporta:

- Múltiples tipos de preguntas (selección única, múltiple, abierta, V/F, etc.)
- Materiales de apoyo diversos
- Seguimiento detallado de progreso
- Sistema de certificados con verificación
- Triggers de validación para asegurar integridad de roles

## Validaciones Implementadas

El sistema incluye triggers de base de datos que previenen:

- Eliminar el único rol (alumno o instructor) de una persona
- Desactivar el único rol activo de una persona

Estas validaciones aseguran que cada persona mantenga al menos un rol activo en el sistema.
