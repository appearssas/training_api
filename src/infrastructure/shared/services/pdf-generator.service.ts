import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ConfigService } from '@nestjs/config';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';

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
  async generateCertificate(certificado: Certificado): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const buffers: Buffer[] = [];

    doc.on('data', (buffer) => buffers.push(buffer));

    // Obtener datos de la inscripción y relaciones
    const inscripcion = certificado.inscripcion as Inscripcion;
    const estudiante = inscripcion.estudiante as any;
    const capacitacion = inscripcion.capacitacion as any;
    const instructor = capacitacion?.instructor as any;

    // Membrete institucional (RF-23)
    // TODO: Cargar imagen del membrete desde configuración
    const membreteUrl = this.configService.get<string>(
      'CERTIFICATE_HEADER_IMAGE',
    );
    if (membreteUrl) {
      try {
        doc.image(membreteUrl, 50, 50, { width: 500, align: 'center' });
      } catch (error) {
        // Si no se puede cargar la imagen, usar texto
        doc.fontSize(24).text('CONFIANZA IPS S.A.S.', { align: 'center' });
      }
    } else {
      doc.fontSize(24).text('CONFIANZA IPS S.A.S.', { align: 'center' });
    }

    doc.moveDown(2);

    // Título del certificado
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('CERTIFICADO DE CAPACITACIÓN', { align: 'center' });

    doc.moveDown(2);

    // Texto del certificado
    doc
      .fontSize(12)
      .font('Helvetica')
      .text('Se certifica que:', { align: 'center' });

    doc.moveDown(1);

    // Nombre completo del conductor (RF-23)
    const nombreCompleto =
      estudiante?.nombres && estudiante?.apellidos
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
    const cursoNombre = capacitacion?.titulo || 'N/A';
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
    const fechaEmision =
      certificado.esRetroactivo && certificado.fechaRetroactiva
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
    const instructorNombre =
      instructor?.nombres && instructor?.apellidos
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
        // El QR ya viene como base64 o URL, intentar cargarlo
        const qrY = doc.y;
        doc.image(certificado.codigoQr, doc.page.width / 2 - 50, qrY, {
          width: 100,
          align: 'center',
        });
        doc.moveDown(1);
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            `Código de verificación: ${certificado.hashVerificacion || certificado.numeroCertificado}`,
            { align: 'center' },
          );
      } catch (error) {
        // Si no se puede cargar el QR, mostrar el código
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(
            `Código de verificación: ${certificado.hashVerificacion || certificado.numeroCertificado}`,
            { align: 'center' },
          );
      }
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
}
