# Configuración de S3 y CloudFront para Storage

## Configuración en AWS

### 1. Crear Bucket S3

1. Ve a AWS Console → S3
2. Crea un nuevo bucket con un nombre único (ej: `training-api-storage`)
3. Configura la región (ej: `us-east-1`)
4. **Deshabilita "Block all public access"** o configura políticas de bucket apropiadas
5. Habilita "Bucket Versioning" (opcional pero recomendado)

### 2. Configurar Política del Bucket

Tienes dos opciones:

#### Opción A: Origin Access Control (OAC) - Recomendado (Más Seguro)

Esta es la forma moderna y más segura. El bucket permanece privado y solo CloudFront puede acceder.

1. En CloudFront, crea un **Origin Access Control (OAC)**:
   - Ve a CloudFront → Policies → Origin access
   - Crea una nueva OAC
   - Copia el ARN de la OAC

2. Agrega esta política al bucket S3:

```json
{
  "Version": "2008-10-17",
  "Id": "PolicyForCloudFrontPrivateContent",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tu-bucket-name/*",
      "Condition": {
        "ArnLike": {
          "AWS:SourceArn": "arn:aws:cloudfront::TU-ACCOUNT-ID:distribution/TU-DISTRIBUTION-ID"
        }
      }
    }
  ]
}
```

**Reemplaza:**

- `TU-ACCOUNT-ID`: Tu Account ID de AWS (ej: `432513807359`)
- `TU-DISTRIBUTION-ID`: El ID de tu distribución de CloudFront (ej: `E12WX2RTBZ4KVQ`)
- `tu-bucket-name`: El nombre de tu bucket

3. En CloudFront, configura el origen para usar OAC en lugar de "Public"

#### Opción B: Bucket Público (Menos Seguro)

Si prefieres hacer el bucket público (no recomendado para producción):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tu-bucket-name/*"
    }
  ]
}
```

### 3. Configurar CloudFront Distribution

1. Ve a AWS Console → CloudFront
2. Crea una nueva distribución
3. **Origin Domain**: Selecciona tu bucket S3 (ej: `tu-bucket-name.s3.us-east-1.amazonaws.com`)
4. **Origin Access**:
   - **Recomendado**: Selecciona "Origin Access Control settings (recommended)" y crea una nueva OAC
   - **Alternativa**: Selecciona "Public" si prefieres bucket público
5. **Viewer Protocol Policy**: "Redirect HTTP to HTTPS" o "HTTPS Only"
6. **Allowed HTTP Methods**: GET, HEAD, OPTIONS (o GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE si necesitas subir archivos)
7. Guarda y espera a que la distribución se cree (puede tomar 10-15 minutos)
8. Copia el **Domain Name** de CloudFront (ej: `d1234567890.cloudfront.net`)
9. **Importante**: Si usas OAC, copia también el **Distribution ID** y **Account ID** para la política del bucket

### 4. Crear Usuario IAM para la API

1. Ve a AWS Console → IAM → Users
2. Crea un nuevo usuario (ej: `training-api-s3-user`)
3. Asigna una política personalizada con estos permisos:

#### Opción A: Permisos Mínimos (Recomendado - Mejor Seguridad)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::tu-bucket-name",
        "arn:aws:s3:::tu-bucket-name/*"
      ]
    }
  ]
}
```

#### Opción B: Full Access (Funciona pero menos seguro)

Si prefieres usar `AmazonS3FullAccess` o una política con `s3:*`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:*", "s3-object-lambda:*"],
      "Resource": "*"
    }
  ]
}
```

**Nota**: Esta política funciona perfectamente, pero es más permisiva de lo necesario. Si solo usas un bucket específico, es mejor restringir los recursos a ese bucket.

4. Crea Access Keys para este usuario
5. Guarda el **Access Key ID** y **Secret Access Key**

## Variables de Entorno

Agrega estas variables de entorno en Render (o tu plataforma de hosting):

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=tu-bucket-name
AWS_ACCESS_KEY_ID=tu-access-key-id
AWS_SECRET_ACCESS_KEY=tu-secret-access-key

# CloudFront URL (opcional pero recomendado)
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net

# Si NO usas S3, puedes usar almacenamiento local con:
# STORAGE_PATH=/app/data
```

## Estructura en S3

El sistema creará automáticamente esta estructura en tu bucket:

```
tu-bucket-name/
├── materials/
│   ├── 1234567890-abc123.pdf
│   └── 1234567891-def456.png
└── certificates/
    ├── certificado-1-1234567890.pdf
    └── certificado-2-1234567891.pdf
```

## URLs de Acceso

Con CloudFront configurado, los archivos serán accesibles en:

- Materiales: `https://d1234567890.cloudfront.net/materials/1234567890-abc123.pdf`
- Certificados: `https://d1234567890.cloudfront.net/certificates/certificado-1-1234567890.pdf`

## Fallback a Almacenamiento Local

Si las variables de entorno de S3 **NO** están configuradas, el sistema usará automáticamente almacenamiento local (disco en Render o carpeta `storage/` local).

## Verificación

1. Sube un archivo a través del endpoint de materiales
2. Verifica que el archivo aparezca en tu bucket S3
3. Verifica que la URL retornada sea de CloudFront
4. Accede a la URL para confirmar que el archivo se sirve correctamente

## Notas Importantes

- **Costo**: S3 tiene 5GB gratis, luego $0.023 por GB/mes
- **CloudFront**: Primeros 1TB gratis, luego $0.085 por GB
- **Rendimiento**: CloudFront mejora significativamente la velocidad de carga de archivos
- **Seguridad**:
  - **OAC (Origin Access Control)** es la forma recomendada y más segura
  - Con OAC, el bucket permanece privado y solo CloudFront puede acceder
  - El código está configurado para funcionar con OAC (no usa ACL)

## Ejemplo de Política con OAC

Si ya tienes una política de OAC como esta:

```json
{
  "Version": "2008-10-17",
  "Id": "PolicyForCloudFrontPrivateContent",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::formar360/*",
      "Condition": {
        "ArnLike": {
          "AWS:SourceArn": "arn:aws:cloudfront::432513807359:distribution/E12WX2RTBZ4KVQ"
        }
      }
    }
  ]
}
```

**Esta política es correcta y solo permite lectura desde CloudFront.**

**Para que la API pueda subir archivos, necesitas agregar los permisos de IAM al usuario de la API** (paso 4). La política del bucket y la política IAM son independientes:

- **Política del bucket**: Controla quién puede leer desde CloudFront (ya la tienes configurada ✅)
- **Política IAM del usuario**: Controla qué puede hacer la API (necesitas configurarla con los permisos del paso 4)

**No necesitas modificar la política del bucket**, solo asegúrate de que el usuario IAM tenga los permisos de escritura (`s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:ListBucket`).
