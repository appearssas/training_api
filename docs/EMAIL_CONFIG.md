# Configuración de Email con Nodemailer

Este documento explica cómo configurar el servicio de email para enviar correos con credenciales temporales.

## Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

### Configuración para qinspecting.com (Producción)

```env
# Configuración de Email - qinspecting.com
EMAIL_ENABLED=true
EMAIL_HOST=mail.qinspecting.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=soporte@qinspecting.com
EMAIL_PASSWORD=tu-contraseña-de-correo
EMAIL_FROM=soporte@qinspecting.com
EMAIL_FROM_NAME=Sistema de Capacitaciones
```

**Nota:** El puerto 465 requiere `EMAIL_SECURE=true` (SSL/TLS).

## Configuración para Gmail

### 1. Habilitar contraseña de aplicación

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa la verificación en 2 pasos si no la tienes activada
3. Ve a "Seguridad" > "Contraseñas de aplicaciones"
4. Genera una nueva contraseña de aplicación para "Correo"
5. Usa esa contraseña en `EMAIL_PASSWORD`

### 2. Configuración en .env

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Contraseña de aplicación de 16 caracteres
EMAIL_FROM=tu-email@gmail.com
EMAIL_FROM_NAME=Sistema de Capacitaciones
```

**Alternativa con puerto 465 (SSL):**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
```

## Configuración para otros proveedores

### qinspecting.com (Producción)

**Configuración SMTP con SSL/TLS (Puerto 465):**

```env
EMAIL_ENABLED=true
EMAIL_HOST=mail.qinspecting.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=soporte@qinspecting.com
EMAIL_PASSWORD=tu-contraseña-de-correo
EMAIL_FROM=soporte@qinspecting.com
EMAIL_FROM_NAME=Sistema de Capacitaciones
```

**Notas importantes:**
- El puerto 465 requiere `EMAIL_SECURE=true` (SSL/TLS)
- Usa la contraseña de la cuenta de correo electrónico
- El servidor requiere autenticación

### Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### SendGrid

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=tu-api-key-de-sendgrid
```

### AWS SES

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-access-key-id
EMAIL_PASSWORD=tu-secret-access-key
```

## Modo Desarrollo

Si `EMAIL_ENABLED=false` o no está configurado, el sistema mostrará las credenciales en los logs en lugar de enviar correos reales. Esto es útil para desarrollo.

## Template de Email

El template HTML se encuentra en:
`src/infrastructure/shared/templates/email-credenciales-temporales.html`

Puedes personalizar el diseño editando este archivo.

