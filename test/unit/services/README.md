# Pruebas Unitarias de Servicios

Este directorio contiene las pruebas unitarias para todos los servicios del backend.

## Estructura

Las pruebas están organizadas por servicio, siguiendo la convención de nombres `*.service.spec.ts`.

## Servicios con Pruebas

### Servicios Simples
- ✅ `app.service.spec.ts` - Pruebas para AppService
- ✅ `qr-generator.service.spec.ts` - Pruebas para QrGeneratorService

### Servicios de Validación
- ✅ `video-url-validator.service.spec.ts` - Validación de URLs de videos (YouTube, Google Drive, OneDrive)
- ✅ `inscripcion-validator.service.spec.ts` - Validación de inscripciones
- ✅ `evaluacion-validator.service.spec.ts` - Validación de evaluaciones
- ✅ `certificado-validator.service.spec.ts` - Validación de certificados

### Servicios de Lógica de Negocio
- ✅ `evaluation-scoring.service.spec.ts` - Cálculo de puntajes de evaluaciones

### Servicios de Infraestructura
- ✅ `image-compression.service.spec.ts` - Compresión de imágenes (con mocks de sharp)
- ✅ `email.service.spec.ts` - Envío de correos electrónicos (con mocks de nodemailer)
- ✅ `s3.service.spec.ts` - Almacenamiento en AWS S3
- ✅ `storage.service.spec.ts` - Servicio de almacenamiento (local/S3)
- ✅ `pdf-generator.service.spec.ts` - Generación de certificados PDF
- ✅ `reports.service.spec.ts` - Generación de reportes
- ✅ `dashboard.service.spec.ts` - Estadísticas del dashboard

## Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Ejecutar pruebas con cobertura
npm run test:cov

# Ejecutar pruebas de un servicio específico
npm test -- test/unit/services/app.service.spec.ts
```

## Cobertura

Las pruebas cubren:
- Casos de éxito
- Casos de error
- Validaciones de entrada
- Lógica de negocio
- Integración con dependencias (usando mocks)

## Notas

- Los servicios que dependen de repositorios usan mocks de TypeORM
- Los servicios que dependen de librerías externas (sharp, nodemailer, AWS SDK) usan mocks
- Las pruebas están diseñadas para ser independientes y rápidas
