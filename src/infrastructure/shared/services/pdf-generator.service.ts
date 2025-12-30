import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { ConfigService } from '@nestjs/config';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

/**
 * Servicio para generar certificados en formato PDF
 * RF-22: Generación automática de certificado PDF
 * RF-23: Campos del certificado (membrete, datos del conductor, QR, firma)
 */
@Injectable()
export class PdfGeneratorService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Genera un certificado en formato PDF
   * @param certificado Entidad del certificado con todas las relaciones
   * @returns Buffer del PDF generado
   */
  async generateCertificate(certificado: Certificado): Promise<any> {
    const doc = new PDFDocument({
      size: 'LETTER',
      layout: 'landscape', // Formato horizontal para el certificado
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const buffers: Buffer[] = [];

    doc.on('data', (buffer) => buffers.push(buffer));

    // Obtener datos de la inscripción y relaciones
    const inscripcion = certificado.inscripcion as Inscripcion;
    
    // Validar que las relaciones estén cargadas
    if (!inscripcion) {
      throw new Error('El certificado no tiene una inscripción asociada');
    }
    
    // IMPORTANTE: Asegurar que la capacitación esté cargada correctamente
    // Si no está cargada, lanzar error para evitar usar datos incorrectos
    if (!inscripcion.capacitacion) {
      throw new Error(
        `La inscripción ${inscripcion.id} no tiene una capacitación asociada. ` +
        `Esto puede causar que el certificado muestre el nombre incorrecto de la capacitación.`,
      );
    }

    // Obtener datos de forma segura
    const estudiante = inscripcion.estudiante as any;
    const capacitacion = inscripcion.capacitacion as any;
    const instructor = capacitacion?.instructor as any;

    // Validar que el estudiante tenga datos
    if (!estudiante) {
      throw new Error('El certificado no tiene datos del estudiante asociado');
    }

    // Convertir fechaVencimiento a Date si es necesario
    const fechaVencimientoDate = certificado.fechaVencimiento
      ? certificado.fechaVencimiento instanceof Date
        ? certificado.fechaVencimiento
        : new Date(certificado.fechaVencimiento)
      : null;

    // Log detallado para debugging: verificar que se está usando la capacitación correcta
    console.log('📄 Generando PDF con datos del certificado:', {
      certificadoId: certificado.id,
      inscripcionId: inscripcion.id,
      capacitacionId: capacitacion?.id,
      capacitacionTitulo: capacitacion?.titulo,
      estudianteId: estudiante?.id,
      estudianteNombre: estudiante?.nombres,
      estudianteApellidos: estudiante?.apellidos,
      estudianteDocumento: estudiante?.numeroDocumento,
      instructorId: instructor?.id,
      instructorNombre: instructor?.nombres,
      instructorApellidos: instructor?.apellidos,
      fechaVencimiento: fechaVencimientoDate?.toISOString(),
    });

    // Validación adicional: asegurar que el título de la capacitación no esté vacío
    if (!capacitacion?.titulo || capacitacion.titulo.trim() === '') {
      throw new Error(
        `La capacitación ${capacitacion?.id} no tiene un título válido. ` +
        `No se puede generar el certificado sin el nombre de la capacitación.`,
      );
    }

    // Cargar y agregar fondo del certificado
    await this.addCertificateBackground(doc);

    // Agregar márgenes internos para el contenido
    const margin = 50;
    doc.x = margin;
    doc.y = margin;

    // Membrete institucional (RF-23)
    // TODO: Cargar imagen del membrete desde configuración
    const membreteUrl = this.configService.get<string>('CERTIFICATE_HEADER_IMAGE');
    if (membreteUrl) {
      try {
        doc.image(membreteUrl, margin, margin, { width: 500, align: 'center' });
        doc.y = doc.y + 80;
      } catch (error) {
        // Si no se puede cargar la imagen, omitir el membrete
        // El membrete ahora se maneja desde el SVG del fondo
        doc.y = doc.y + 20;
      }
    } else {
      // Omitir el membrete de texto - se maneja desde el SVG del fondo
      doc.y = doc.y + 20;
    }

    doc.moveDown(2);

    // Título del certificado
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('CERTIFICADO DE CAPACITACIÓN', { align: 'center' });

    doc.moveDown(2);

    // Texto del certificado
    doc.fontSize(12).font('Helvetica').text('Se certifica que:', { align: 'center' });

    doc.moveDown(1);

    // Nombre completo del conductor (RF-23)
    const nombreCompleto = estudiante?.nombres && estudiante?.apellidos
      ? `${estudiante.nombres} ${estudiante.apellidos}`
      : 'N/A';
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(nombreCompleto, { align: 'center' });

    doc.moveDown(1);

    // Número de documento (RF-23)
    const documento = estudiante?.numeroDocumento || 'N/A';
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Documento de Identidad: ${documento}`, { align: 'center' });

    doc.moveDown(2);

    // Nombre del curso (RF-23)
    // IMPORTANTE: Usar directamente el título de la capacitación cargada
    // No usar valores por defecto para evitar mostrar información incorrecta
    const cursoNombre = capacitacion?.titulo;
    
    if (!cursoNombre) {
      throw new Error('No se puede generar el certificado: el nombre de la capacitación no está disponible');
    }
    
    doc
      .fontSize(12)
      .font('Helvetica')
      .text('Ha completado exitosamente la capacitación:', { align: 'center' });

    doc.moveDown(0.5);

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(cursoNombre, { align: 'center' });

    doc.moveDown(2);

    // Fecha de emisión (RF-23, RF-28)
    const fechaEmision = certificado.esRetroactivo && certificado.fechaRetroactiva
      ? new Date(certificado.fechaRetroactiva)
      : certificado.fechaEmision;
    const fechaFormateada = fechaEmision.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Fecha de emisión: ${fechaFormateada}`, { align: 'center' });

    doc.moveDown(2);

    // Nombre del capacitador (RF-23)
    const instructorNombre = instructor?.nombres && instructor?.apellidos
      ? `${instructor.nombres} ${instructor.apellidos}`
      : 'N/A';
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Capacitador: ${instructorNombre}`, { align: 'center' });

    doc.moveDown(3);

    // Firma digital (RF-23)
    const firmaDigitalUrl = certificado.firmaDigital;
    if (firmaDigitalUrl) {
      try {
        doc.image(firmaDigitalUrl, doc.page.width / 2 - 100, doc.y, {
          width: 200,
          align: 'center',
        });
        doc.moveDown(2);
      } catch (error) {
        // Si no se puede cargar, usar texto
        doc.text('_________________________', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).text('Firma Digital', { align: 'center' });
      }
    } else {
      doc.text('_________________________', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text('Firma Digital', { align: 'center' });
    }

    doc.moveDown(2);

    // Código QR (RF-24)
    if (certificado.codigoQr) {
      try {
        // El QR puede venir como base64 con o sin prefijo data:image
        let qrImageData = certificado.codigoQr;
        
        // Si no tiene el prefijo data:image, agregarlo
        if (!qrImageData.startsWith('data:image')) {
          qrImageData = `data:image/png;base64,${qrImageData}`;
        }
        
        // Convertir base64 a buffer si es necesario
        let qrBuffer: Buffer;
        if (qrImageData.startsWith('data:image')) {
          // Extraer el base64 del data URI
          const base64Data = qrImageData.split(',')[1];
          qrBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // Asumir que ya es base64 puro
          qrBuffer = Buffer.from(qrImageData, 'base64');
        }
        
        // Posicionar el QR en la parte inferior derecha del certificado (formato horizontal)
        const qrSize = 120;
        const qrX = doc.page.width - qrSize - 80; // Margen derecho
        const qrY = doc.page.height - qrSize - 80; // Parte inferior
        
        doc.image(qrBuffer, qrX, qrY, {
          width: qrSize,
          height: qrSize,
        });
        
        // Texto del código de verificación debajo del QR
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            `Código: ${certificado.hashVerificacion || certificado.numeroCertificado}`,
            qrX,
            qrY + qrSize + 5,
            {
              width: qrSize,
              align: 'center',
            },
          );
      } catch (error) {
        console.error('Error al cargar el QR en el PDF:', error);
        // Si no se puede cargar el QR, mostrar el código en la parte inferior
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(
            `Código de verificación: ${certificado.hashVerificacion || certificado.numeroCertificado}`,
            { align: 'center' },
          );
      }
    } else {
      // Si no hay QR, mostrar al menos el código de verificación
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          `Código de verificación: ${certificado.hashVerificacion || certificado.numeroCertificado}`,
          { align: 'center' },
        );
    }

    // Finalizar el documento
    doc.end();

    // Esperar a que termine la generación
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      doc.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Agrega el fondo oficial del certificado (SVG convertido a imagen)
   * @param doc Documento PDF
   */
  private async addCertificateBackground(doc: any): Promise<void> {
    try {
      // Ruta al archivo SVG del fondo
      const svgPath = join(process.cwd(), 'public', 'assets', 'cert_back.svg');
      
      console.log('🔍 Buscando fondo de certificado en:', svgPath);
      
      // Verificar si el archivo existe
      if (!existsSync(svgPath)) {
        console.warn(`⚠️ Fondo de certificado no encontrado en: ${svgPath}`);
        console.warn(`📁 Directorio actual: ${process.cwd()}`);
        return;
      }

      console.log('✅ Archivo SVG encontrado, leyendo...');
      
      // Leer el SVG
      const svgBuffer = readFileSync(svgPath);
      console.log(`📦 Tamaño del SVG: ${svgBuffer.length} bytes`);

      // Convertir SVG a PNG usando sharp
      // El tamaño del PDF es LETTER en formato horizontal (792x612 puntos)
      console.log('🎨 Convirtiendo SVG a PNG...');
      // Convertir SVG a PNG
      // IMPORTANTE: El tamaño del PDF LETTER en formato horizontal es 792 (ancho) x 612 (alto) puntos
      // El SVG tiene viewBox="0 0 792 612" (ancho x alto en formato horizontal)
      // El SVG y el PDF ahora están en el mismo formato horizontal, no se necesita rotación
      const PDF_WIDTH = 792;  // Ancho del PDF LETTER en horizontal
      const PDF_HEIGHT = 612;  // Alto del PDF LETTER en horizontal
      
      console.log(`📐 Tamaño del PDF: ${PDF_WIDTH} x ${PDF_HEIGHT} puntos (horizontal)`);
      console.log(`📐 Tamaño del SVG: 792 x 612 (viewBox - horizontal)`);
      console.log('✅ SVG y PDF en el mismo formato horizontal, sin rotación necesaria');
      
      const pngBuffer = await sharp(svgBuffer, {
        density: 300, // Alta resolución para mejor calidad
      })
        .resize(PDF_WIDTH, PDF_HEIGHT, {
          fit: 'fill', // Llenar exactamente el tamaño sin mantener proporciones
        })
        .png()
        .toBuffer();

      console.log(`✅ PNG generado: ${pngBuffer.length} bytes`);

      // Agregar el fondo como imagen en la posición (0, 0) cubriendo toda la página
      // IMPORTANTE: Esto debe hacerse ANTES de agregar cualquier contenido
      console.log('🖼️ Agregando fondo al PDF...');
      
      // Guardar el estado actual del documento
      const savedX = doc.x;
      const savedY = doc.y;
      
      // Resetear la posición del cursor a (0, 0) para agregar el fondo
      doc.x = 0;
      doc.y = 0;
      
      // Agregar el fondo en la posición (0, 0) sin márgenes
      // PDFKit: doc.image(buffer, x, y, options)
      // Usar las constantes ya declaradas arriba
      try {
        doc.image(pngBuffer, 0, 0, {
          width: PDF_WIDTH,
          height: PDF_HEIGHT,
        });
        console.log(`✅ Imagen de fondo agregada en posición (0, 0) con tamaño ${PDF_WIDTH}x${PDF_HEIGHT}`);
      } catch (imageError) {
        console.error('❌ Error al agregar imagen al PDF:', imageError);
        throw imageError;
      }
      
      // Resetear la posición para el contenido (después del fondo)
      doc.x = 0;
      doc.y = 0;
      
      console.log('✅ Fondo agregado exitosamente al certificado');
    } catch (error) {
      console.error('❌ Error al cargar el fondo del certificado:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      // Continuar sin fondo si hay error
    }
  }
}

