import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { ConfigService } from '@nestjs/config';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
import { join } from 'path';

// Fix: Usar ruta dinámica basada en el directorio de trabajo actual (process.cwd())
// Esto funciona tanto en Windows (Local) como en Linux (Docker/Render)
const PUBLIC_ASSETS_PATH = join(process.cwd(), 'public', 'assets');
const SVG_ABSOLUTE_PATH = join(PUBLIC_ASSETS_PATH, 'certificado_svg.svg');

console.log('---------------------------------------------------------');
console.log('PDF GENERATOR SERVICE - ASSET PATH DEBUG');
console.log('Process CWD:', process.cwd());
console.log('PUBLIC_ASSETS_PATH:', PUBLIC_ASSETS_PATH);
console.log('SVG_ABSOLUTE_PATH:', SVG_ABSOLUTE_PATH);
console.log('SVG Exists?:', existsSync(SVG_ABSOLUTE_PATH));
console.log('---------------------------------------------------------');

import { QrGeneratorService } from './qr-generator.service';
import { readFileSync, existsSync } from 'fs';

@Injectable()
export class PdfGeneratorService {
  constructor(
    private readonly configService: ConfigService,
    private readonly qrGeneratorService: QrGeneratorService
  ) {}

  async generateCertificate(certificado: Certificado): Promise<any> {
    const doc = new PDFDocument({
      size: 'LETTER',
      layout: 'landscape',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (buffer) => buffers.push(buffer));

    const inscripcion = certificado.inscripcion as Inscripcion;
    if (!inscripcion || !inscripcion.capacitacion || !inscripcion.estudiante) {
      throw new Error('Datos incompletos.');
    }

    const estudiante = inscripcion.estudiante as any;
    const capacitacion = inscripcion.capacitacion as any;

    // -- CONFIGURACIÓN --
    const docWidth = doc.page.width;
    const centerX = docWidth / 2;

    // 1. FONDO
    await this.addCertificateBackground(doc);

    // 0. LOGO SUPERIOR CENTRADO (CONDICIONAL) - Moved after background
    const titulo = (capacitacion?.titulo || '').toLowerCase().trim();
    // FIX: Usar minusculas porque 'titulo' ya fue convertido a .toLowerCase()
    const contieneSustancias = titulo.includes('sustancias');
    const contienePeligrosas = titulo.includes('peligrosas');

   
    const logoAndarName = 'andar.png';
    const logoSarotoName = 'saroto.jpeg';
    
    // Construir rutas absolutas usando path.join para compatibilidad
    const logoPath =
      contieneSustancias && contienePeligrosas
        ? join(PUBLIC_ASSETS_PATH, logoSarotoName)
        : join(PUBLIC_ASSETS_PATH, logoAndarName);

    console.log(`[PDF Debug] Logo Path seleccionado: ${logoPath}`);

    const logoWidth = 120; // ajusta según necesites
    const logoHeight = 60; // ajusta según necesites
    const logoX = centerX - logoWidth / 2;
    const logoY = 50; 

    // Verificar existencia antes de intentar pintar (opcional pero recomendado)
    if (existsSync(logoPath)) {
        console.log(`[PDF Debug] El archivo de logo EXISTE. Intentando pintar en (${logoX}, ${logoY}).`);
        doc.image(logoPath, logoX, logoY, {
          width: logoWidth,
          height: logoHeight,
        });
    } else {
        console.warn(`[PDF Debug] ALERTA: Logo not found at: ${logoPath}`);
    }

    // 2. TÍTULO PRINCIPAL (Y=140)
    doc.x = 0;
    doc.y = 140;

    doc
      .fontSize(22)
      .fillColor('#0D47A1')
      .font('Helvetica-Bold')
      .text('CERTIFICADO DE APROBACIÓN', { align: 'center' });

    doc.moveDown(0.5);

    // 3. HEADER TEXT
    doc.fontSize(10).fillColor('black');
    doc.font('Helvetica').text('Otorgado por', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(12).font('Helvetica-Bold').text('FORMAR360', { align: 'center' });
    doc.moveDown(0.2);

    doc.moveDown(1.2);

    // 4. CERTIFICA QUE
    const lineaY = doc.y + 6;
    doc.lineWidth(0.5).strokeColor('#999999');
    doc.moveTo(centerX - 120, lineaY).lineTo(centerX - 70, lineaY).stroke();
    doc.moveTo(centerX + 70, lineaY).lineTo(centerX + 120, lineaY).stroke();

    doc
      .fontSize(9)
      .fillColor('#666666')
      .font('Helvetica')
      .text('CERTIFICA QUE:', { align: 'center' });

    doc.moveDown(1.0);

    // 5. NOMBRE ESTUDIANTE
    const nombreCompleto =
      estudiante?.nombres && estudiante?.apellidos
        ? `${estudiante.nombres} ${estudiante.apellidos}`.toUpperCase()
        : 'ESTUDIANTE';

    doc
      .fontSize(22)
      .fillColor('#0D47A1')
      .font('Helvetica-Bold')
      .text(nombreCompleto, { align: 'center' });

    doc.moveDown(0.3);

    // 6. CÉDULA
    const documento = estudiante?.numeroDocumento || 'N/A';
    doc
      .fontSize(11)
      .fillColor('black')
      .font('Helvetica')
      .text(`Cédula de ciudadanía N.° ${documento}`, { align: 'center' });

    doc.moveDown(1.2);

    // 7. DESCRIPCIÓN
    doc
      .fontSize(11)
      .fillColor('#444444')
      .font('Helvetica')
      .text('Ha realizado y aprobado satisfactoriamente el curso de:', { align: 'center' });

    doc.moveDown(0.8);

    // 8. CURSO (BOTÓN AZUL)
    const cursoNombre = (capacitacion?.titulo || 'CURSO SIN NOMBRE').toUpperCase();

    doc.fontSize(14).font('Helvetica-Bold');
    const textWidth = doc.widthOfString(cursoNombre);
    const boxPadding = 20;
    const boxWidth = textWidth + boxPadding * 2;
    const boxHeight = 30;
    const boxX = centerX - boxWidth / 2;
    const boxY = doc.y;

    doc
      .roundedRect(boxX, boxY, boxWidth, boxHeight, 8)
      .fillColor('#0D47A1')
      .fill();
    doc
      .fillColor('white')
      .text(cursoNombre, boxX, boxY + 8, { width: boxWidth, align: 'center' });

    doc.y = boxY + boxHeight + 15;

    // 9. DETALLES (CENTRADO)
    doc.x = 0;
    doc.fillColor('black');
    doc.fontSize(10).font('Helvetica');

    doc.text('Con una intensidad de 20 horas', 0, doc.y, {
      width: docWidth,
      align: 'center',
    });
    doc.text('Resolucion: 0000000000', 0, doc.y, {
      width: docWidth,
      align: 'center',
    });

    // 10. FIRMAS + GARABATOS FALSOS
    const footerY = 500;
    const col1X = centerX - 180;
    const col2X = centerX + 80;

    doc.lineWidth(1).strokeColor('black');

    // Firma izquierda (garabato)
    doc.save();
    doc.strokeColor('#000066').lineWidth(2);
    doc
      .moveTo(col1X - 30, footerY - 20)
      .bezierCurveTo(
        col1X - 20,
        footerY - 40,
        col1X + 20,
        footerY - 10,
        col1X + 40,
        footerY - 30,
      )
      .stroke();
    doc.restore();

    doc.moveTo(col1X - 80, footerY).lineTo(col1X + 80, footerY).stroke();
    doc.text('Anderson Herrera Díaz', col1X - 80, footerY + 5, {
      width: 160,
      align: 'center',
    });
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'Instructor / Entrenador\nTSA REG 37544429\nLicencia SST',
        col1X - 80,
        footerY + 20,
        { width: 160, align: 'center' },
      );

    // Firma derecha (garabato)
    doc.save();
    doc.strokeColor('#000066').lineWidth(2);
    doc
      .moveTo(col2X - 40, footerY - 25)
      .bezierCurveTo(
        col2X - 10,
        footerY - 10,
        col2X + 10,
        footerY - 45,
        col2X + 50,
        footerY - 20,
      )
      .stroke();
    doc.restore();

    doc.moveTo(col2X - 80, footerY).lineTo(col2X + 80, footerY).stroke();
    doc.fontSize(10).font('Helvetica-Bold').text(
      'Edwin Julian Parra Morales',
      col2X - 80,
      footerY + 5,
      {
        width: 160,
        align: 'center',
      },
    );
    doc
      .fontSize(8)
      .font('Helvetica')
      .text('Representante Legal\nANDAR DEL LLANO', col2X - 80, footerY + 20, {
        width: 160,
        align: 'center',
      });

    // 11. QR (GENERADO EN TIEMPO REAL para asegurar URL correcta)
    // Ignoramos el QR guardado en BD para evitar problemas de dominios (localhost vs prod)
    if (certificado.hashVerificacion) {
      try {
        // 1. Generar URL completa basada en la configuración ACTUAL del servidor
        const urlVerificacion = this.qrGeneratorService.generateVerificationUrlForQR(certificado.hashVerificacion);
        
        // 2. Generar imagen QR en tiempo real
        const qrBase64 = await this.qrGeneratorService.generateQRCode(urlVerificacion);
        
        // 3. Procesar imagen
        const base64Data = qrBase64.split(',')[1];
        const qrBuffer = Buffer.from(base64Data, 'base64');
        const qrSize = 70;
        const qrX = 690;
        const qrY = 445;
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
        
        console.log(`[PDF] QR regenerado dinámicamente: ${urlVerificacion}`);
      } catch (e) {
        console.error('Error generando QR dinámico:', e);
         // Fallback: intentar usar el guardado si falla el dinámico
         if (certificado.codigoQr) {
            try {
                let qrImageData = certificado.codigoQr;
                 if (!qrImageData.startsWith('data:image')) {
                   qrImageData = `data:image/png;base64,${qrImageData}`;
                 }
                const base64Data = qrImageData.split(',')[1];
                const qrBuffer = Buffer.from(base64Data, 'base64');
                doc.image(qrBuffer, 690, 445, { width: 70, height: 70 });
            } catch(ex) {}
         }
      }
    }

    doc.end();
    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
  }

  private async addCertificateBackground(doc: any): Promise<void> {
    try {
      if (existsSync(SVG_ABSOLUTE_PATH)) {
        const svgBuffer = readFileSync(SVG_ABSOLUTE_PATH);
        const pngBuffer = await sharp(svgBuffer).png().toBuffer();
        doc.image(pngBuffer, 0, 0, { width: 792, height: 612 });
      }
    } catch (e) {
      console.error(e);
    }
  }
}
