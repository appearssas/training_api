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

2. Configurar variables de entorno:

Copia el archivo `env.example` a `.env` y ajusta las variables:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=trainings_db
PORT=3000
NODE_ENV=development
```

3. Iniciar base de datos con Docker:

```bash
# Iniciar MySQL en Docker
docker-compose up -d

# Verificar que el contenedor esté corriendo
docker-compose ps
```

4. Opción A: Ejecutar migraciones (Recomendado)

```bash
# Generar migración inicial desde las entidades
yarn typeorm:migration:generate generate InitialSchema

# Ejecutar migraciones
yarn typeorm:migration:run
```

4. Opción B: Importar script SQL directamente

```bash
# Conectar a la base de datos en Docker
docker exec -i training_api_db mysql -uroot -proot trainings_db < trainings_database_normalized.sql
```

O importa el archivo `trainings_database_normalized.sql` desde tu cliente MySQL conectándote a `localhost:3306`.

## Ejecutar la aplicación

### Con Docker (Recomendado)

```bash
# 1. Iniciar base de datos
docker-compose up -d

# 2. Ejecutar migraciones (si es necesario)
yarn typeorm:migration:run

# 3. Iniciar aplicación en desarrollo
yarn start:dev
```

### Sin Docker

```bash
# Asegúrate de tener MySQL corriendo localmente
# y configurado en el archivo .env

# Desarrollo
yarn start:dev

# Producción
yarn build
yarn start:prod
```

### Comandos Docker útiles

```bash
# Ver logs de la base de datos
docker-compose logs -f db

# Detener base de datos
docker-compose down

# Detener y eliminar volúmenes (⚠️ elimina datos)
docker-compose down -v

# Reiniciar base de datos
docker-compose restart db
```

## Estructura del Proyecto

```
src/
├── entities/           # Entidades TypeORM
│   ├── catalogos/     # Catálogos maestros
│   ├── evaluaciones/  # Entidades de evaluaciones
│   └── ...
├── migrations/        # Migraciones de base de datos
├── database/          # Configuración de base de datos
└── app.module.ts      # Módulo principal
```

## Migraciones

El proyecto utiliza TypeORM para gestionar migraciones de base de datos.

### Comandos disponibles

```bash
# Generar migración desde cambios en entidades
yarn typeorm:migration:generate generate <NombreMigracion>

# Crear migración vacía (para SQL manual)
yarn typeorm:migration:create <NombreMigracion>

# Ejecutar migraciones pendientes
yarn typeorm:migration:run

# Revertir última migración
yarn typeorm:migration:revert
```

### Ejemplos

```bash
# Generar migración desde cambios en entidades
yarn typeorm:migration:generate generate AddNewFieldToPersona

# Crear migración vacía para SQL personalizado
yarn typeorm:migration:create CustomDataMigration

# Ejecutar todas las migraciones pendientes
yarn typeorm:migration:run
```

**Nota:** Las migraciones se almacenan en `src/migrations/` y se ejecutan automáticamente en orden cronológico.

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
