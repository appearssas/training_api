# Diseño del Sistema de Roles

## Arquitectura Híbrida: Roles + Tablas Específicas

Este sistema utiliza un enfoque híbrido que combina lo mejor de ambos mundos:

### 1. **Sistema de Roles** (Para Permisos y Acceso)

- **Tabla `roles`**: Catálogo de roles del sistema (ADMIN, INSTRUCTOR, ALUMNO)
- **Tabla `persona_roles`**: Relación muchos a muchos entre personas y roles
- **Campo `rol_principal_id` en `usuarios`**: Rol por defecto/principal del usuario

### 2. **Tablas Específicas** (Para Datos del Rol)

- **Tabla `alumnos`**: Datos específicos del rol ALUMNO (código_estudiante, fecha_ingreso)
- **Tabla `instructores`**: Datos específicos del rol INSTRUCTOR (especialidad, biografía, estadísticas)

## Ventajas de este Diseño

### ✅ Flexibilidad

- Una persona puede tener **múltiples roles simultáneamente** (ej: instructor Y alumno)
- Fácil agregar nuevos roles sin modificar estructura existente
- Permisos basados en roles activos

### ✅ Separación de Responsabilidades

- **Roles**: Para permisos, acceso y autorización
- **Tablas específicas**: Para datos de negocio específicos del rol

### ✅ Escalabilidad

- Agregar nuevos roles solo requiere insertar en `roles` y crear tabla específica si es necesario
- No requiere modificar tablas existentes

### ✅ Consultas Eficientes

- Consultar "todos los instructores" → JOIN con `persona_roles` y `roles`
- Consultar "datos del instructor" → JOIN con tabla `instructores`
- Consultar "permisos" → Verificar roles activos en `persona_roles`

## Reglas de Negocio

1. **Una persona DEBE tener un usuario** (obligatorio)
2. **Una persona DEBE tener al menos un rol activo** (ALUMNO o INSTRUCTOR)
3. **Si una persona tiene rol ALUMNO**, debe existir registro en tabla `alumnos`
4. **Si una persona tiene rol INSTRUCTOR**, debe existir registro en tabla `instructores`
5. **Una persona puede tener múltiples roles** (ej: instructor que también es alumno)

## Ejemplos de Uso

### Crear un Instructor

```sql
-- 1. Crear persona
INSERT INTO personas (...) VALUES (...);

-- 2. Crear usuario con rol principal
INSERT INTO usuarios (persona_id, username, password_hash, rol_principal_id)
VALUES (1, 'instructor1', 'hash', (SELECT id FROM roles WHERE codigo = 'INSTRUCTOR'));

-- 3. Asignar rol INSTRUCTOR
INSERT INTO persona_roles (persona_id, rol_id)
VALUES (1, (SELECT id FROM roles WHERE codigo = 'INSTRUCTOR'));

-- 4. Crear registro en tabla instructores
INSERT INTO instructores (persona_id, especialidad, ...) VALUES (1, 'Desarrollo Web', ...);
```

### Crear un Instructor que también es Alumno

```sql
-- 1-3. Igual que arriba

-- 4. Asignar también rol ALUMNO
INSERT INTO persona_roles (persona_id, rol_id)
VALUES (1, (SELECT id FROM roles WHERE codigo = 'ALUMNO'));

-- 5. Crear registro en tabla alumnos
INSERT INTO alumnos (persona_id, codigo_estudiante) VALUES (1, 'EST001');
```

### Verificar Permisos

```sql
-- Verificar si una persona puede crear capacitaciones (debe ser INSTRUCTOR)
SELECT COUNT(*) > 0 as puede_crear_capacitaciones
FROM persona_roles pr
JOIN roles r ON pr.rol_id = r.id
WHERE pr.persona_id = 1
  AND r.codigo = 'INSTRUCTOR'
  AND pr.activo = 1;
```

## Comparación con Alternativas

### ❌ Solo Tablas Específicas (Diseño Anterior)

- **Problema**: No permite múltiples roles fácilmente
- **Problema**: Difícil gestionar permisos
- **Problema**: Redundancia con campo `rol` en usuarios

### ❌ Solo Sistema de Roles

- **Problema**: Datos específicos del rol (especialidad, código_estudiante) requieren JSON o campos genéricos
- **Problema**: Consultas más complejas
- **Problema**: Menos explícito y claro

### ✅ Híbrido (Diseño Actual) - RECOMENDADO

- **Ventaja**: Lo mejor de ambos mundos
- **Ventaja**: Flexible y escalable
- **Ventaja**: Datos estructurados y permisos claros
