import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CertificateFormatsService } from '../infrastructure/certificate-formats/certificate-formats.service';
import { CertificateFormatType } from '../entities/certificate-formats/certificate-format.entity';

/**
 * Script para inicializar los valores por defecto de configuración de certificados en la base de datos
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const certificateFormatsService = app.get(CertificateFormatsService);

  const configOtros = {
    cursoNombre: {
      x: 396,
      y: 395,
      fontSize: 18,
      bold: true,
      color: [255, 255, 255],
    },
    nombreEstudiante: {
      x: 396,
      y: 290,
      fontSize: 18,
      bold: true,
      color: [41, 37, 97],
    },
    documento: {
      x: 450,
      y: 320,
      fontSize: 18,
      bold: false,
    },
    duracion: {
      x: 445,
      y: 422,
      fontSize: 14,
      bold: false,
    },
    fechaEmision: {
      x: 250,
      y: 437,
      fontSize: 14,
      bold: false,
    },
    fechaVencimiento: {
      x: 520,
      y: 438,
      fontSize: 14,
      bold: false,
    },
    qr: {
      x: 689,
      y: 449,
      size: 70,
    },
    instructorFirma: {
      x: 130,
      y: 450,
      width: 190,
      height: 80,
    },
    instructorNombre: {
      x: 150,
      y: 505,
      fontSize: 10,
      bold: true,
      color: [41, 37, 97],
    },
    instructorRol: {
      x: 150,
      y: 513,
      fontSize: 9.5,
      bold: false,
      lineSpacing: 12,
      color: [41, 37, 97],
    },
    representanteFirma: {
      x: 495,
      y: 445,
      width: 145,
      height: 61,
    },
    representanteNombre: {
      x: 485,
      y: 505,
      fontSize: 9.9,
      bold: true,
      color: [41, 37, 97],
    },
    representanteRol: {
      x: 515,
      y: 513,
      fontSize: 9.5,
      bold: false,
      color: [41, 37, 97],
    },
    footer: {
      x: 396,
      y: 590,
      fontSize: 7,
      bold: true,
      color: [41, 37, 97],
    },
  };

  try {
    // Verificar si ya existe una configuración activa
    const existing = await certificateFormatsService.findActive();
    
    if (existing) {
      console.log('✅ Ya existe una configuración activa. Actualizando...');
      await certificateFormatsService.update(existing.id, {
        configOtros,
        activo: true,
      });
      console.log('✅ Configuración actualizada exitosamente');
    } else {
      console.log('📝 Creando nueva configuración...');
      const created = await certificateFormatsService.create({
        tipo: CertificateFormatType.OTROS,
        configOtros,
      });
      console.log('✅ Configuración creada exitosamente con ID:', created.id);
    }
  } catch (error) {
    console.error('❌ Error al inicializar configuración:', error);
    process.exit(1);
  }

  await app.close();
}

bootstrap();
