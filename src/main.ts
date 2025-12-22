import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir archivos estáticos
  app.useStaticAssets(join(process.cwd(), 'public'));

  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: true, // Permite cualquier origen en desarrollo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Habilitar validación global con validación estricta de enums
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false, // Deshabilitar conversión implícita para validación estricta
      },
      // Validar enums estrictamente sin transformación
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Habilitar CORS
  app.enableCors();

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Training API')
    .setDescription(
      `API para el sistema de gestión de capacitaciones

## Funcionalidades principales:

### Gestión de Usuarios
- **Registro de usuarios**: Registro de personas naturales o jurídicas con asignación de roles
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
- Certificados`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa el token JWT',
        in: 'header',
      },
      'JWT-auth', // Este nombre se usará en los decoradores @ApiBearerAuth()
    )
    .addTag('auth', 'Endpoints de autenticación y registro de usuarios')
    .addTag('people', 'Endpoints de gestión de personas y conductores externos')
    .addTag('payments', 'Endpoints de gestión de pagos y habilitación de conductores')
    .addTag('terms', 'Endpoints de aceptación de términos y políticas')
    .addTag('capacitaciones', 'Endpoints de gestión de capacitaciones')
    .addTag('inscripciones', 'Endpoints de gestión de inscripciones')
    .addTag('evaluaciones', 'Endpoints de gestión de evaluaciones')
    .addTag('materiales', 'Endpoints de gestión de materiales')
    .addTag('certificados', 'Endpoints de gestión de certificados')
    .addTag('certificates', 'Endpoints de reportes y alertas de certificados')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
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
