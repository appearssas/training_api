# Guía de Migraciones

Este proyecto utiliza TypeORM para gestionar las migraciones de base de datos de forma controlada y versionada.

## Configuración

Las migraciones están configuradas en `typeorm.config.ts` y utilizan las variables de entorno del archivo `.env`.

## Comandos Disponibles

### Generar Migración desde Entidades

Genera una migración automáticamente comparando las entidades actuales con el estado de la base de datos:

```bash
yarn typeorm:migration:generate generate <NombreMigracion>
```

**Ejemplo:**

```bash
yarn typeorm:migration:generate generate AddEmailToPersona
```

Esto creará un archivo como: `src/migrations/1234567890-AddEmailToPersona.ts`

### Crear Migración Vacía

Crea una migración vacía para escribir SQL personalizado:

```bash
yarn typeorm:migration:create <NombreMigracion>
```

**Ejemplo:**

```bash
yarn typeorm:migration:create CustomDataMigration
```

### Ejecutar Migraciones

Ejecuta todas las migraciones pendientes:

```bash
yarn typeorm:migration:run
```

### Revertir Migración

Revierte la última migración ejecutada:

```bash
yarn typeorm:migration:revert
```

## Flujo de Trabajo Recomendado

1. **Hacer cambios en las entidades** (agregar campos, relaciones, etc.)

2. **Generar la migración:**

   ```bash
   yarn typeorm:migration:generate generate DescripcionCambios
   ```

3. **Revisar el archivo generado** en `src/migrations/` y ajustar si es necesario

4. **Ejecutar la migración:**
   ```bash
   yarn typeorm:migration:run
   ```

## Estructura de una Migración

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class NombreMigracion1234567890 implements MigrationInterface {
  name = 'NombreMigracion1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Código para aplicar la migración
    await queryRunner.query(`
      ALTER TABLE personas 
      ADD COLUMN nuevo_campo VARCHAR(255) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Código para revertir la migración
    await queryRunner.query(`
      ALTER TABLE personas 
      DROP COLUMN nuevo_campo
    `);
  }
}
```

## Buenas Prácticas

1. **Nombres descriptivos:** Usa nombres que describan claramente el cambio
   - ✅ `AddEmailToPersona`
   - ✅ `CreateRolesTable`
   - ❌ `Migration1`
   - ❌ `Update`

2. **Una migración por cambio lógico:** No mezcles múltiples cambios no relacionados

3. **Siempre implementa `down()`:** Permite revertir cambios si es necesario

4. **Revisa las migraciones generadas:** TypeORM puede generar SQL que necesite ajustes

5. **No edites migraciones ya ejecutadas:** Crea una nueva migración para corregir

## Migración Inicial

Para crear la migración inicial desde el esquema SQL existente:

1. Importa el SQL manualmente o
2. Genera la migración desde las entidades:
   ```bash
   yarn typeorm:migration:generate generate InitialSchema
   ```

## Solución de Problemas

### Error: "No changes in database schema were found"

Esto significa que las entidades coinciden con el estado actual de la base de datos. Si necesitas crear una migración, usa `create` en lugar de `generate`.

### Error de sintaxis MySQL

Los scripts incluyen correcciones automáticas para problemas comunes de MySQL 8.0, pero si encuentras errores, revisa:

- Precisión en `CURRENT_TIMESTAMP(6)`
- Comas faltantes antes de `PRIMARY KEY`
- Sintaxis de `ON UPDATE`

### Migraciones no se ejecutan

Verifica:

1. Variables de entorno en `.env`
2. Conexión a la base de datos
3. Que la tabla `migrations` exista (se crea automáticamente)
