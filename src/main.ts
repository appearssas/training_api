import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  console.log('--------------------------------------------------');
  console.log(
    '🚀 BACKEND DEPLOYMENT: 2026-01-03 17:25 (Image/QR Fixes Proven)',
  );
  console.log('--------------------------------------------------');

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir archivos estáticos
  app.useStaticAssets(join(process.cwd(), 'public'));
  // Servir archivos de materiales desde storage
  // En Render, el disco se monta en /app/data, configurar STORAGE_PATH=/app/data
  const storagePath =
    process.env.STORAGE_PATH || join(process.cwd(), 'storage');

  // Verificar tipo de almacenamiento al iniciar
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const useS3 = !!(bucketName && accessKeyId && secretAccessKey);

  console.log('\n🔍 Verificación de almacenamiento:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (useS3) {
    const cloudFrontUrl = process.env.AWS_CLOUDFRONT_URL;
    const region = process.env.AWS_REGION || 'us-east-1';
    console.log('✅ Tipo: AWS S3');
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Región: ${region}`);
    console.log(
      `   Access Key ID: ${accessKeyId ? '✅ Configurado' : '❌ No configurado'}`,
    );
    console.log(
      `   Secret Access Key: ${secretAccessKey ? '✅ Configurado' : '❌ No configurado'}`,
    );
    if (cloudFrontUrl) {
      console.log(`   CloudFront: ${cloudFrontUrl}`);
    } else {
      console.log(
        `   CloudFront: ❌ No configurado (usando URL directa de S3)`,
      );
    }
  } else {
    const isRender = !!process.env.RENDER || storagePath.startsWith('/app/');
    const storageType = isRender ? 'Render (disco persistente)' : 'Local';
    console.log(`✅ Tipo: ${storageType}`);
    console.log(`   Ruta: ${storagePath}`);
    if (isRender) {
      console.log(
        `   Variable RENDER: ${process.env.RENDER ? '✅ Detectada' : '❌ No detectada'}`,
      );
      console.log(
        `   Ruta detectada como Render: ${storagePath.startsWith('/app/') ? '✅ Sí' : '❌ No'}`,
      );
    }
    console.log(`   Variables S3:`);
    console.log(
      `     AWS_S3_BUCKET_NAME: ${bucketName ? '✅ Configurado' : '❌ No configurado'}`,
    );
    console.log(
      `     AWS_ACCESS_KEY_ID: ${accessKeyId ? '✅ Configurado' : '❌ No configurado'}`,
    );
    console.log(
      `     AWS_SECRET_ACCESS_KEY: ${secretAccessKey ? '✅ Configurado' : '❌ No configurado'}`,
    );
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  app.useStaticAssets(storagePath, {
    prefix: '/storage',
  });

  // Fix: Servir certificados directamente desde /certificates para compatibilidad con URLs antiguas o generadas incorrectamente
  app.useStaticAssets(join(storagePath, 'certificates'), {
    prefix: '/certificates',
  });

  // Habilitar CORS para permitir peticiones desde el frontend
  const allowedOrigins: string[] = [
    'http://localhost:8080',
    'http://localhost:9000',
    'https://training-dev.onrender.com',
    'https://plataforma.formar360.com',
    'https://www.formar360.com',
    process.env.FRONTEND_URL,
  ].filter((origin): origin is string => Boolean(origin)); // Filtra valores nulos/undefined y asegura tipo string

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Training API')
    .setDescription(
      `API para el sistema de gestión de capacitaciones

## Funcionalidades principales:

### Gestión de Usuarios
- **Registro de usuarios**: Registro de personas naturales o jurídicas con asignación de roles
- **Listado y búsqueda de usuarios**: Paginación, filtros por rol/estado y búsqueda avanzada
- **Edición de usuarios**: Actualización de datos, roles y estados de usuarios
- **Eliminación de usuarios**: Soft-delete para mantener integridad de datos
- **Carga masiva de conductores**: Importación de conductores mediante archivo CSV
- **Gestión de roles**: Sistema de roles (ADMIN, CLIENTE, INSTRUCTOR, ALUMNO, OPERADOR)
- **Conductores externos**: Creación y gestión de conductores externos
- **Pagos manuales**: Registro de pagos para habilitar conductores externos
- **Habilitación de conductores**: Proceso de habilitación tras registro de pago

### Cumplimiento Normativo
- **Aceptación de términos y políticas**: Sistema obligatorio de aceptación de documentos legales
- **Bloqueo de acceso**: Los usuarios deben aceptar términos antes de acceder al sistema
- **Trazabilidad**: Registro completo de aceptaciones con fecha, IP y user agent
- **Gestión de documentos legales**: Administración de términos y condiciones, políticas de privacidad

### Autenticación
- Login y registro de usuarios
- Gestión de perfiles
- Recuperación de contraseña
- Refresh tokens
- **Validación de términos**: El login verifica que el usuario haya aceptado los términos activos

### Capacitaciones
- Creación y gestión de capacitaciones
- Materiales y evaluaciones
- Inscripciones de estudiantes
- Certificados

### Certificados (RF-22 a RF-34)
- **Generación automática de certificados PDF**: Creación de certificados con número único, QR code y almacenamiento en servidor
- **Certificados retroactivos**: Emisión de certificados con fecha anterior, justificación y auditoría completa
- **Descarga de certificados**: Endpoint para descargar certificados en formato PDF
- **Verificación pública**: Sistema de verificación pública de certificados mediante token UUID sin autenticación
- **Auditoría completa**: Registro de quién emitió/modificó certificados retroactivos y cuándo

### Evaluaciones (RF-16 a RF-21)
- **Gestión de evaluaciones**: Creación, actualización y consulta de evaluaciones asociadas a capacitaciones
- **Tipos de preguntas**: Soporte para 5 tipos de preguntas (single, multiple, image, true_false, yes_no)
- **Calificación automática**: Sistema de calificación automática con porcentaje mínimo configurable
- **Intentos limitados**: Control de número máximo de intentos permitidos por evaluación
- **Consulta de evaluaciones**: Endpoints para obtener evaluaciones por ID o por curso`,
    )
    .setVersion('1.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description:
          'Pegar solo el token JWT (sin "Bearer "). Obtenerlo desde POST /auth/login.',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Endpoints de autenticación y registro de usuarios')
    .addTag(
      'users',
      'Endpoints de gestión de usuarios (listar, editar, eliminar) - Solo ADMIN',
    )
    .addTag('people', 'Endpoints de gestión de personas y conductores externos')
    .addTag(
      'payments',
      'Endpoints de gestión de pagos y habilitación de conductores',
    )
    .addTag('capacitaciones', 'Endpoints de gestión de capacitaciones')
    .addTag('inscripciones', 'Endpoints de gestión de inscripciones')
    .addTag('evaluaciones', 'Endpoints de gestión de evaluaciones')
    .addTag('materiales', 'Endpoints de gestión de materiales')
    .addTag('certificados', 'Endpoints de gestión de certificados')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}`);
  console.log(
    `📚 Documentación Swagger disponible en: http://localhost:${port}/docs`,
  );
}
bootstrap();
