# Configuración de Storage

El sistema soporta dos modos de almacenamiento:

## Opción 1: AWS S3 con CloudFront (Recomendado para producción)

Ver [S3_CLOUDFRONT_SETUP.md](./S3_CLOUDFRONT_SETUP.md) para instrucciones completas.

**Ventajas:**
- Escalable y confiable
- CDN global con CloudFront
- 5GB gratis en S3
- Mejor rendimiento

**Variables de entorno requeridas:**
```bash
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=tu-bucket-name
AWS_ACCESS_KEY_ID=tu-access-key-id
AWS_SECRET_ACCESS_KEY=tu-secret-access-key
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

## Opción 2: Almacenamiento Local (Disco en Render)

### Configuración del Disco en Render

### 1. Mount Path
El disco debe estar montado en: **`/app/data`**

Esta es la ruta absoluta donde Render montará el disco persistente.

### 2. Variable de Entorno

Agregar la siguiente variable de entorno en Render:

```
STORAGE_PATH=/app/data
```

**Nota:** Si no configuras las variables de S3, el sistema usará automáticamente almacenamiento local.

### 3. Estructura de Carpetas

El sistema creará automáticamente la siguiente estructura dentro de `/app/data`:

```
/app/data/
├── materials/     # Archivos de materiales subidos
└── certificates/  # Certificados PDF generados
```

### 4. Verificación

Después de configurar:
1. El sistema creará automáticamente las carpetas si no existen
2. Los archivos se guardarán en `/app/data/materials/` y `/app/data/certificates/`
3. Los archivos serán accesibles vía HTTP en `/storage/materials/` y `/storage/certificates/`

### 5. Notas Importantes

- El disco en Render es persistente, por lo que los archivos no se perderán al reiniciar el servicio
- El tamaño del disco debe ser suficiente para almacenar todos los materiales y certificados
- Los archivos se sirven como estáticos a través del endpoint `/storage/*`

## Prioridad de Configuración

El sistema usa esta prioridad:
1. **S3 + CloudFront**: Si están configuradas todas las variables de AWS, usa S3
2. **Almacenamiento Local**: Si no hay configuración de S3, usa almacenamiento local (disco o carpeta `storage/`)

