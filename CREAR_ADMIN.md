# Guía para Crear Administradores

Este documento explica las diferentes formas de crear usuarios administradores en el sistema.

## Método 1: Seeder (Recomendado para el primer administrador)

El seeder crea automáticamente un administrador inicial cuando ejecutas los seeders.

### Credenciales por defecto del administrador inicial:

- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@training.local`
- **Documento:** `0000000000`

### Pasos para crear el administrador inicial:

1. **Asegúrate de que los roles estén creados:**
   ```bash
   yarn seed
   ```

2. **El seeder creará automáticamente:**
   - Los roles (ADMIN, INSTRUCTOR, ALUMNO)
   - El administrador inicial con las credenciales por defecto

3. **⚠️ IMPORTANTE:** Cambia la contraseña después del primer inicio de sesión.

### Ejecutar solo el seeder de administrador:

Si solo quieres crear/verificar el administrador:

```bash
# El seeder verifica si ya existe un admin con username "admin"
# Si existe, no lo crea nuevamente
yarn seed
```

## Método 2: Endpoint API (Para crear administradores adicionales)

Una vez que tengas un administrador, puedes crear más administradores usando el endpoint API.

### Endpoint:

```
POST /auth/admin
```

### Requisitos:

- **Autenticación:** Requiere token JWT válido
- **Autorización:** Solo usuarios con rol `ADMIN` pueden crear otros administradores

### Headers:

```
Authorization: Bearer <tu_token_jwt>
Content-Type: application/json
```

### Body (ejemplo):

```json
{
  "numeroDocumento": "1234567890",
  "tipoDocumento": "CC",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "email": "juan.perez@example.com",
  "username": "admin.juan",
  "password": "SecurePassword123!",
  "telefono": "+573001234567",
  "fechaNacimiento": "1990-01-15",
  "genero": "M",
  "direccion": "Calle 123 #45-67"
}
```

### Campos obligatorios:

- `numeroDocumento` (string)
- `nombres` (string)
- `apellidos` (string)
- `email` (string, formato email válido)
- `username` (string, mínimo 3 caracteres)
- `password` (string, mínimo 6 caracteres)

### Campos opcionales:

- `tipoDocumento` (enum: CC, TI, CE, PA, RC, NIT) - Por defecto: CC
- `telefono` (string)
- `fechaNacimiento` (string, formato ISO: YYYY-MM-DD)
- `genero` (enum: M, F, O)
- `direccion` (string)

### Respuesta exitosa (201):

```json
{
  "id": 1,
  "username": "admin.juan",
  "email": "juan.perez@example.com",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "rol": "ADMIN"
}
```

### Errores posibles:

- **400:** Datos inválidos o faltantes
- **401:** Token JWT inválido o ausente
- **403:** No tienes permisos (no eres administrador)
- **409:** El username, email o documento ya está registrado

## Ejemplo de uso con cURL:

```bash
# 1. Iniciar sesión como administrador
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# 2. Usar el token para crear otro administrador
curl -X POST http://localhost:3000/auth/admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token_jwt>" \
  -d '{
    "numeroDocumento": "1234567890",
    "tipoDocumento": "CC",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "email": "juan.perez@example.com",
    "username": "admin.juan",
    "password": "SecurePassword123!"
  }'
```

## Notas de seguridad:

1. **Cambiar contraseña por defecto:** El administrador inicial tiene la contraseña `admin123`. Cámbiala inmediatamente después del primer inicio de sesión.

2. **Contraseñas seguras:** Al crear nuevos administradores, usa contraseñas seguras con al menos:
   - 8 caracteres mínimo
   - Mayúsculas y minúsculas
   - Números
   - Caracteres especiales

3. **Acceso limitado:** Solo los administradores pueden crear otros administradores. Esto previene la escalación de privilegios.

4. **Validación de datos:** El sistema valida que:
   - El username sea único
   - El email sea único
   - El número de documento sea único

## Solución de problemas:

### El seeder no crea el administrador:

1. Verifica que el rol ADMIN exista:
   ```bash
   yarn seed
   ```

2. Verifica que no exista ya un usuario con username "admin":
   - El seeder no sobrescribe administradores existentes

### No puedo crear administradores por API:

1. Verifica que estés autenticado con un token válido
2. Verifica que tu usuario tenga el rol `ADMIN`
3. Verifica que el token no haya expirado (válido por 24 horas)

### Error 409 (Conflicto):

- El username, email o documento ya está registrado
- Usa diferentes valores o verifica si el usuario ya existe

