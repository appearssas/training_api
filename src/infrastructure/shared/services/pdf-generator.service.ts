import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { QrGeneratorService } from './qr-generator.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

// Fix: Usar ruta dinámica basada en el directorio de trabajo actual (process.cwd())
// Esto funciona tanto en Windows (Local) como en Linux (Docker/Render)
let PUBLIC_ASSETS_PATH = join(process.cwd(), 'public', 'assets');

// Fallback robusto para producción en Docker
if (!existsSync(PUBLIC_ASSETS_PATH)) {
 
  PUBLIC_ASSETS_PATH = '/app/public/assets';
  
  // Second fallback: relative path (if workdir is /app, then ./public/assets might be valid)
  if (!existsSync(PUBLIC_ASSETS_PATH)) {
      
      // Use path.resolve to get absolute path from relative
      const relativePath = join(process.cwd(), 'public', 'assets');
       if (existsSync(relativePath)) {
           PUBLIC_ASSETS_PATH = relativePath;
       } else {
           // Last resort: just try 'public/assets' if the CWD is strangely set
           PUBLIC_ASSETS_PATH = 'public/assets';
       }
  }
}

const SVG_ABSOLUTE_PATH = join(PUBLIC_ASSETS_PATH, 'certificado_svg.svg');


try {
  const { readdirSync } = require('fs');
  const files = readdirSync(PUBLIC_ASSETS_PATH);
  console.log('Files in ASSETS directory:', files);
} catch (error) {
  console.error('Could not list assets directory:', error.message);
}

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

   
    const logoAndarName = 'andar.svg';
    const logoSarotoName = 'ceasaroto.svg';
    const logoConfianzaName = 'confianza.svg';
    
    // Usar Ceasaroto si cumple condiciones
    const usarCeasaroto = contieneSustancias && contienePeligrosas;
    
    const mainLogoPath = usarCeasaroto
        ? join(PUBLIC_ASSETS_PATH, logoSarotoName)
        : join(PUBLIC_ASSETS_PATH, logoAndarName);
    
    const confianzaLogoPath = join(PUBLIC_ASSETS_PATH, logoConfianzaName);


    // Aumentar tamaño 15% si es Ceasaroto
    // Aumentar tamaño +20% adicional (Iteration 4) (Total aprox +90%)
    const mainLogoWidth = usarCeasaroto ? 251 : 126; 
    const mainLogoHeight = usarCeasaroto ? 124 : 63; 
    
    // Confianza logo ampliado (Iteration 13 - Decoupled Y)
    const confianzaLogoWidth = 208; 
    const confianzaLogoHeight = 105; 

    // Gap negativo para forzar cercanía
    const gap = -20; 
    
    // Ancho página = 792. 
    // Right Anchor adjustment: 767
    const rightAnchorX = 767;

    // Calcular posiciones de derecha a izquierda
    // Calcular posiciones de derecha a izquierda
    const startXConfianza = rightAnchorX - confianzaLogoWidth;
    // Mover AMBOS logos 15px a la derecha. Ceasaroto ya tenía 30px, ahora 45px. Andar 15px.
    const startXMain = startXConfianza - gap - mainLogoWidth + (usarCeasaroto ? 45 : 15);
    
    // Posiciones Y independientes (Iteración 13)
    const logoYConfianza = 30; // Subido (High)
    // Si es Ceasaroto, subir 10px más (20). Si no, mantener en 40.
    const logoYMain = usarCeasaroto ? 20 : 40;

    // Función helper para dibujar un logo con dimensiones específicas
    const drawLogo = async (path: string, x: number, w: number, h: number, y: number) => {
        if (existsSync(path)) {
            try {
                if (path.endsWith('.svg')) {
                    // VECTOR RENDER (SVG-TO-PDFKIT)
                    const svgContent = readFileSync(path, 'utf-8');
                    // @ts-ignore
                    const SVGtoPDF = require('svg-to-pdfkit');
                    
                    // Options: assume pt units, preserve aspect ratio
                    SVGtoPDF(doc, svgContent, x, y, { 
                        width: w, 
                        height: h,
                        preserveAspectRatio: 'xMidYMid meet',
                        assumePt: true // Important for scaling behavior
                    });
                } else {
                    // RASTER RENDER (IMAGES)
                    const logoBuffer = readFileSync(path);
                    doc.image(logoBuffer, x, y, {
                        width: w,
                        height: h,
                        fit: [w, h],
                        align: 'center',
                        valign: 'center'
                    });
                }
            } catch (err) {
                console.error(`[PDF Debug] Error procesando logo ${path}:`, err);
            }
        } else {
            console.warn(`[PDF Debug] ALERTA: Logo not found at: ${path}`);
        }
    };

    // Dibujar Logo 1 (Izquierda del grupo) - Main Logo
    await drawLogo(mainLogoPath, startXMain, mainLogoWidth, mainLogoHeight, logoYMain);

    // Dibujar Logo 2 (Derecha del grupo) - Confianza
    await drawLogo(confianzaLogoPath, startXConfianza, confianzaLogoWidth, confianzaLogoHeight, logoYConfianza);

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
    const resolutionText = contieneSustancias && contienePeligrosas
      ? 'Resolucion N° 1585 de 05 de junio de 2025, secretaria de educacion soacha'
      : 'Resolución N° 1500-67-10/1811 de 28 de junio de 2024, secretaria de educacion villavicencio';

    doc.text(resolutionText, 0, doc.y, {
      width: docWidth,
      align: 'center',
    });

    // 10. FIRMAS + GARABATOS FALSOS
    // 10. FIRMAS + GARABATOS FALSOS
    const footerY = 500;
    const col1X = centerX - 145; // Shifted +15 (was -160)
    const col2X = centerX + 115; // Shifted +15 (was +100)

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
        const qrX = 687; // Movido 4px derecha (683 -> 687)
        const qrY = 450; // Movido 5px arriba (455 -> 450)
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
        
       
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
                // Ajustar también el fallback a las nuevas coordenadas
                doc.image(qrBuffer, 687, 450, { width: 70, height: 70 });
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
        // REVERT TO RASTER (High-DPI) due to crash with vector background
        const svgBuffer = readFileSync(SVG_ABSOLUTE_PATH);
        // Render at 300 DPI (approx 4x standard 72 DPI) for crisp quality
        const pngBuffer = await sharp(svgBuffer, { density: 300 }).png().toBuffer();
        doc.image(pngBuffer, 0, 0, { width: 792, height: 612 });
      }
    } catch (e) {
      console.error(e);
    }
  }
}
