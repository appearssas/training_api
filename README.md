# Training API

API REST para sistema de capacitaciones tipo Udemy, construida con NestJS y TypeORM siguiendo **Arquitectura Hexagonal (Ports & Adapters)**.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura Hexagonal](#arquitectura-hexagonal)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Ejecutar la aplicación](#ejecutar-la-aplicación)
- [Migraciones](#migraciones)
- [Entidades Principales](#entidades-principales)
- [Agregar Nuevos Módulos](#agregar-nuevos-módulos)

---

## Características

- ✅ Sistema completo de capacitaciones con secciones y lecciones
- ✅ Materiales de apoyo (adjuntos, links, imágenes)
- ✅ Evaluaciones flexibles con cualquier tipo de pregunta
- ✅ Seguimiento de progreso de estudiantes
- ✅ Sistema de certificados
- ✅ Reseñas y calificaciones
- ✅ Gestión de personas, usuarios, alumnos e instructores
- ✅ **Arquitectura Hexagonal** para alta testabilidad y mantenibilidad
- ✅ TypeORM con migraciones para gestión de esquema
- ✅ Docker Compose para desarrollo

---

## 🏗️ Arquitectura Hexagonal

Este proyecto implementa **Arquitectura Hexagonal** (Ports & Adapters) para garantizar:

- ✅ **Separación de responsabilidades**: Domain, Application e Infrastructure claramente separados
- ✅ **Testabilidad**: Fácil de testear porque el dominio no tiene dependencias externas
- ✅ **Mantenibilidad**: Código organizado y fácil de entender
- ✅ **Flexibilidad**: Puedes cambiar la base de datos o framework sin afectar el dominio
- ✅ **Independencia**: El dominio es independiente de frameworks y tecnologías

### Capas de la Arquitectura

1. **Domain (Dominio)** - Lógica de negocio pura, sin dependencias externas
   - Contiene los **puertos** (interfaces) que definen los contratos
   - Ejemplo: `ICapacitacionesRepository`

2. **Application (Aplicación)** - Casos de uso que orquestan la lógica
   - **DTOs**: Objetos de transferencia de datos
   - **Use Cases**: Casos de uso que implementan la lógica de negocio
   - Ejemplo: `CreateCapacitacionUseCase`

3. **Infrastructure (Infraestructura)** - Implementaciones concretas
   - **Controllers**: Endpoints REST
   - **Repository Adapters**: Implementación de los puertos
   - **Modules**: Configuración de NestJS
   - Ejemplo: `CapacitacionesRepositoryAdapter`

### Flujo de Datos

```
HTTP Request
    ↓
[Controller] (Infrastructure - Adaptador de Entrada)
    ↓
[Use Case] (Application - Caso de Uso)
    ↓
[Repository Interface] (Domain - Puerto)
    ↓
[Repository Adapter] (Infrastructure - Adaptador de Salida)
    ↓
Database (TypeORM Entities)
```

---

## 📁 Estructura del Proyecto

```
src/
├── domain/                    # Capa de Dominio (Núcleo)
│   ├── capacitaciones/
│   │   └── ports/            # Interfaces de repositorio
│   │       └── capacitaciones.repository.port.ts
│   ├── personas/
│   │   └── ports/            # (Por implementar)
│   └── inscripciones/
│       └── ports/            # (Por implementar)
│
├── application/               # Capa de Aplicación
│   ├── capacitaciones/
│   │   ├── dto/              # DTOs de transferencia
│   │   │   ├── create-capacitacion.dto.ts
│   │   │   └── update-capacitacion.dto.ts
│   │   └── use-cases/         # Casos de uso
│   │       ├── create-capacitacion.use-case.ts
│   │       ├── find-all-capacitaciones.use-case.ts
│   │       ├── find-one-capacitacion.use-case.ts
│   │       ├── update-capacitacion.use-case.ts
│   │       └── remove-capacitacion.use-case.ts
│   └── shared/
│       └── dto/               # DTOs compartidos
│           └── pagination.dto.ts
│
├── infrastructure/            # Capa de Infraestructura
│   ├── capacitaciones/
│   │   ├── capacitaciones.controller.ts
│   │   ├── capacitaciones.module.ts
│   │   └── capacitaciones.repository.adapter.ts
│   └── shared/
│       └── database/
│           └── database.module.ts
│
├── entities/                  # Entidades TypeORM
│   ├── capacitacion.entity.ts
│   ├── persona.entity.ts
│   ├── usuario.entity.ts
│   ├── catalogos/
│   ├── evaluaciones/
│   └── ...
│
└── migrations/                # Migraciones de base de datos
```

---

## Requisitos

- Node.js 18+
- MySQL 5.7+ o MariaDB 10.3+
- Yarn o npm
- Docker (opcional, para desarrollo)

---

## Instalación

1. **Instalar dependencias:**

```bash
yarn install
# o
npm install
```

2. **Configurar variables de entorno:**

Copia el archivo `.env.example` a `.env` y ajusta las variables:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=trainings_db
PORT=3000
NODE_ENV=development
```

3. **Iniciar base de datos con Docker:**

```bash
# Iniciar MySQL en Docker
docker-compose up -d db

# Verificar que el contenedor esté corriendo
docker-compose ps
```

4. **Configurar base de datos:**

**Opción A: Ejecutar migraciones (Recomendado)**

```bash
# Generar migración inicial desde las entidades
yarn typeorm:migration:generate generate InitialSchema

# Ejecutar migraciones
yarn typeorm:migration:run
```

**Opción B: Importar script SQL directamente**

```bash
# Conectar a la base de datos en Docker
docker exec -i training_api_db mysql -uroot -proot trainings_db < trainings_database_normalized.sql
```

O importa el archivo `trainings_database_normalized.sql` desde tu cliente MySQL conectándote a `localhost:3306`.

---

## Ejecutar la aplicación

### Con Docker (Recomendado)

```bash
# 1. Iniciar base de datos
docker-compose up -d db

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

---

## Migraciones

El proyecto utiliza TypeORM para gestionar migraciones de base de datos de forma controlada y versionada.

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

Para más detalles, consulta [MIGRATIONS.md](./MIGRATIONS.md).

---

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

---

## Agregar Nuevos Módulos

Para agregar un nuevo módulo siguiendo la arquitectura hexagonal:

### 1. Crear el Puerto (Domain)

```typescript
// src/domain/nuevo-modulo/ports/nuevo-modulo.repository.port.ts
export interface INuevoModuloRepository {
  create(dto: CreateDto): Promise<Entity>;
  findAll(pagination: PaginationDto): Promise<any>;
  findOne(id: number): Promise<Entity | null>;
  update(id: number, dto: UpdateDto): Promise<Entity>;
  remove(id: number): Promise<void>;
}
```

### 2. Crear DTOs y Casos de Uso (Application)

```typescript
// src/application/nuevo-modulo/dto/create-nuevo-modulo.dto.ts
export class CreateNuevoModuloDto {
  // Propiedades del DTO
}

// src/application/nuevo-modulo/use-cases/create-nuevo-modulo.use-case.ts
@Injectable()
export class CreateNuevoModuloUseCase {
  constructor(
    @Inject('INuevoModuloRepository')
    private readonly repository: INuevoModuloRepository,
  ) {}

  async execute(dto: CreateNuevoModuloDto): Promise<Entity> {
    return this.repository.create(dto);
  }
}
```

### 3. Implementar el Adaptador (Infrastructure)

```typescript
// src/infrastructure/nuevo-modulo/nuevo-modulo.repository.adapter.ts
@Injectable()
export class NuevoModuloRepositoryAdapter implements INuevoModuloRepository {
  constructor(
    @InjectRepository(Entity)
    private readonly repository: Repository<Entity>,
    private readonly dataSource: DataSource,
  ) {}

  // Implementar métodos del puerto
}

// src/infrastructure/nuevo-modulo/nuevo-modulo.controller.ts
@Controller('nuevo-modulo')
export class NuevoModuloController {
  constructor(
    private readonly createUseCase: CreateNuevoModuloUseCase,
    // ... otros casos de uso
  ) {}

  @Post()
  create(@Body() dto: CreateNuevoModuloDto) {
    return this.createUseCase.execute(dto);
  }
}

// src/infrastructure/nuevo-modulo/nuevo-modulo.module.ts
@Module({
  controllers: [NuevoModuloController],
  providers: [
    CreateNuevoModuloUseCase,
    // ... otros casos de uso
    {
      provide: 'INuevoModuloRepository',
      useClass: NuevoModuloRepositoryAdapter,
    },
    DataSource,
  ],
  imports: [TypeOrmModule.forFeature([Entity])],
})
export class NuevoModuloModule {}
```

### 4. Registrar el Módulo

```typescript
// src/app.module.ts
import { NuevoModuloModule } from './infrastructure/nuevo-modulo/nuevo-modulo.module';

@Module({
  imports: [
    // ...
    NuevoModuloModule,
  ],
})
export class AppModule {}
```

---

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

---

## Scripts Disponibles

```bash
# Desarrollo
yarn start:dev          # Iniciar en modo desarrollo con hot-reload
yarn start:debug        # Iniciar en modo debug

# Producción
yarn build              # Compilar TypeScript
yarn start:prod         # Iniciar versión compilada

# Calidad de código
yarn lint               # Ejecutar ESLint
yarn format             # Formatear código con Prettier

# Testing
yarn test               # Ejecutar tests unitarios
yarn test:watch         # Ejecutar tests en modo watch
yarn test:cov           # Ejecutar tests con cobertura

# Migraciones
yarn typeorm:migration:generate generate <Nombre>
yarn typeorm:migration:create <Nombre>
yarn typeorm:migration:run
yarn typeorm:migration:revert
```

---

## Tecnologías Utilizadas

- **NestJS** - Framework Node.js progresivo
- **TypeORM** - ORM para TypeScript/JavaScript
- **MySQL** - Base de datos relacional
- **Docker** - Contenedorización
- **class-validator** - Validación de DTOs
- **class-transformer** - Transformación de objetos

---

## Licencia

UNLICENSED
