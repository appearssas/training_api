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
    
    // Register Fonts
    doc.registerFont('Montserrat', join(PUBLIC_ASSETS_PATH, 'fonts', 'Montserrat-Regular.ttf'));
    doc.registerFont('Montserrat-Bold', join(PUBLIC_ASSETS_PATH, 'fonts', 'Montserrat-Bold.ttf'));

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
    await this.addCertificateBackground(doc, capacitacion);

    // 2. TÍTULO PRINCIPAL (Y=140)
    doc.x = 0;
    doc.y = 140;

    doc
      .fontSize(22)
      .fillColor('#292561')
      .font('Montserrat-Bold')

    doc.moveDown(0.5);

    // 3. HEADER TEXT
    doc.fontSize(10).fillColor('#292561');

    doc.moveDown(1.2);

    // 4. CERTIFICA QUE
 

    doc.moveDown(1.0);

    // 5. NOMBRE ESTUDIANTE
    const nombreCompleto =
      estudiante?.nombres && estudiante?.apellidos
        ? `${estudiante.nombres} ${estudiante.apellidos}`.toUpperCase()
        : 'ESTUDIANTE';

    doc.y += 90;
    doc
      .fontSize(22)
      .fillColor('#292561')
      .font('Montserrat-Bold')
      .text(nombreCompleto, { align: 'center' });
    doc.y -= 90;

    doc.moveDown(3.3);

    // 6. CÉDULA
    const documento = estudiante?.numeroDocumento || 'N/A';
    doc
      .fontSize(14.5)
      .fillColor('#292561')
      .font('Montserrat-Bold')
      .text(` ${documento}`, 83, doc.y + 9.5, { align: 'center', width: docWidth });

    doc.moveDown(6.5);

    // 7. DESCRIPCIÓN


    // 8. CURSO (BOTÓN AZUL)
    const cursoNombre = (capacitacion?.titulo || 'CURSO SIN NOMBRE').toUpperCase();

    doc.fontSize(21).font('Montserrat-Bold');
    const textWidth = doc.widthOfString(cursoNombre);
    const boxPadding = 20;
    const boxWidth = textWidth + boxPadding * 2;
    const boxHeight = 30;
    const boxX = centerX - boxWidth / 2;
    const boxY = doc.y - 68.5;

 
    doc
      .fillColor('white')
      .text(cursoNombre, boxX, boxY + 8, { width: boxWidth, align: 'center' });

    doc.y = boxY + boxHeight + 15;

    // 9. DETALLES (CENTRADO)
    doc.x = 0;
    doc.fillColor('#292561');
    doc.fontSize(12).font('Montserrat-Bold');

    const tituloForDuration = (capacitacion?.titulo || '').toLowerCase().trim();
    let duration = '20';

    if (
        tituloForDuration.includes('curso') &&
        (tituloForDuration.includes('basico') || tituloForDuration.includes('básico')) &&
        tituloForDuration.includes('transporte') &&
        (tituloForDuration.includes('mercancias') || tituloForDuration.includes('mercancías')) &&
        tituloForDuration.includes('peligrosas')
    ) {
        duration = '60';
    } else if (
        (tituloForDuration.includes('manipulacion') || tituloForDuration.includes('manipulación')) &&
        tituloForDuration.includes('alimentos')
    ) {
        duration = '10';
    }

    doc.text(duration, 47, doc.y - 3.5, {
      width: docWidth,
      align: 'center',
    });

    doc.moveDown(1);

    const localeDateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: '2-digit' };
    const fechaEmision = certificado.fechaEmision
      ? new Date(certificado.fechaEmision).toLocaleDateString('es-ES', localeDateOptions)
      : '';
    const fechaVencimiento = certificado.fechaVencimiento
      ? new Date(certificado.fechaVencimiento).toLocaleDateString('es-ES', localeDateOptions)
      : '';

    doc.fontSize(12.5).font('Montserrat');
    // Emission: Up 10px, shifted Left 50px
    doc.text(`${fechaEmision}`, -80, doc.y - 14.5, { width: docWidth, align: 'center' });
    
    if (fechaVencimiento) {
        // Expiration: Up 20px (from current cursor), shifted Right 60px
        doc.text(`${fechaVencimiento}.`, 186, doc.y - 16, { width: docWidth, align: 'center' });
    }

 doc.x = 0;
    doc.fillColor('#292561');
    doc.fontSize(11.5).font('Montserrat');

    // 10. FIRMAS + GARABATOS FALSOS
    // 10. FIRMAS + GARABATOS FALSOS
    const footerY = 500;
    const col1X = centerX - 145; // Shifted +15 (was -160)
    const col2X = centerX + 115; // Shifted +15 (was +100)

    doc.lineWidth(1).strokeColor('black');

    // Firma izquierda (Imagen Real - Instructor)
    // Viviana Rojas (General) vs Nini Peña (Alimentos/Primeros Auxilios)
    
    let instructorSignatureImage = 'firma_viviana_rojas.png'; // Default
    
    if (
        ((tituloForDuration.includes('manipulacion') || tituloForDuration.includes('manipulación')) && tituloForDuration.includes('alimentos')) ||
        (tituloForDuration.includes('primeros') && tituloForDuration.includes('auxilios'))
    ) {
        instructorSignatureImage = 'firma_nini_pena.png';
    }

    const instructorSigPath = join(PUBLIC_ASSETS_PATH, instructorSignatureImage);

    if (existsSync(instructorSigPath)) {
        try {
            const insSigWidth = 120;
            const insSigHeight = 50;
            // Center over the instructor name text box
            // Instructor name box starts at col1X - 160, width 260. Center is col1X - 160 + 130 = col1X - 30.
            const insSigX = (col1X - 30) - (insSigWidth / 2);
            const insSigY = footerY - 45; 

            const insSigBuffer = readFileSync(instructorSigPath);
            doc.image(insSigBuffer, insSigX, insSigY, { width: insSigWidth, height: insSigHeight, fit: [insSigWidth, insSigHeight] });
        } catch (e) {
            console.error('Error loading instructor signature image:', e);
        }
    }

  let instructorname =  'Viviana Paola Rojas Hincapie';
  let instructornametp =  'Instructor / Entrenador\nTSA REG xxxxxxxxx\nLicencia SST';

    if (
        ((tituloForDuration.includes('manipulacion') || tituloForDuration.includes('manipulación')) && tituloForDuration.includes('alimentos')) ||
        (tituloForDuration.includes('primeros') && tituloForDuration.includes('auxilios'))
    ) {
        instructorname = 'Nini Johana Peña Vanegaz';
        instructornametp =  'Instructor / Entrenador\nTSA REG xxxxxxxxx\nLicencia SST';
    }
    doc.font('Montserrat-Bold').text(instructorname, col1X - 160, footerY + 5, {
      width: 260,
      align: 'center',
    });
    doc
      .fontSize(10.5)
      .font('Montserrat')
      .text(instructornametp
       ,
        col1X - 110,
        footerY + 20,
        { width: 160, align: 'center' },
      );

    // Firma derecha (garabato)
    // Firma derecha (Imagen Real)
    let signatureImageName = 'firma_alfonso_velasco.png'; // Default (Sustancias, General, etc.)
    
    // Logic: Alimentos / Primeros Auxilios -> Firma Francy
    if (
        ((tituloForDuration.includes('manipulacion') || tituloForDuration.includes('manipulación')) && tituloForDuration.includes('alimentos')) ||
        (tituloForDuration.includes('primeros') && tituloForDuration.includes('auxilios'))
    ) {
        signatureImageName = 'firma_francy_gonzalez.png';
    }

    const signaturePath = join(PUBLIC_ASSETS_PATH, signatureImageName);
    
    if (existsSync(signaturePath)) {
        try {
            // Center of the text box is roughly col2X + 60
            // We want to center the image there.
            const sigWidth = 120;
            const sigHeight = 50; 
            // Adjust X to center over the name text box (col2X - 70 + 260/2 = col2X + 60)
            const sigX = (col2X + 60) - (sigWidth / 2);
            const sigY = footerY - 45; // Place above the name

            const sigBuffer = readFileSync(signaturePath);
            doc.image(sigBuffer, sigX, sigY, { width: sigWidth, height: sigHeight, fit: [sigWidth, sigHeight] });
        } catch (e) {
            console.error('Error loading signature image:', e);
        }
    }

   
    let representativeName = 'Alfonso Alejandro Velasco Reyes';

    if (
        ((tituloForDuration.includes('manipulacion') || tituloForDuration.includes('manipulación')) && tituloForDuration.includes('alimentos')) ||
        (tituloForDuration.includes('primeros') && tituloForDuration.includes('auxilios'))
    ) {
        representativeName = 'Francy Dayany Gonzalez Galindo';
    }

    doc.fontSize(11.5).font('Montserrat-Bold').text(
      representativeName,
      col2X - 70, // Shifted left to center wider box (was -20)
      footerY + 5,
      {
        width: 260, // Increased from 160 to fit full name
        align: 'center',
      },
    );
    doc
      .fontSize(10.5)
      .font('Montserrat')
      .text('Representante Legal\n', col2X - 20, footerY + 20, {
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
        const qrX = 688; // Movido 4px derecha (683 -> 687)
        const qrY = 448.5; // Movido 5px arriba (455 -> 450)
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

    // 12. Footer with Legal Text and Contact Info
    const footerTextY = 576;
    doc.fillColor('#292561');
    doc.fontSize(10).font('Montserrat');
    // We use a wide box starting at 0 to center effectively across the landscape page (width 792)
    // Adjusted X to -150 to shift the whole block left
    
    // Calculate widths manually to ensure perfect alignment without overlaps
    doc.fontSize(10);
    doc.font('Montserrat');
    const t1 = 'Certificado emitido por ';
    const t3 = ' en alianza con ';
    const t5 = ' La autenticidad de este documento puede verificarse escaneando el código QR.';
    
    doc.font('Montserrat-Bold');
    const t2 = 'FORMAR360';

    // Logic for Alliance Company Name (Same as Background Logic)
    let allianceCompany = 'ANDAR DEL LLANO.'; // Default logic (if no match)

    if (
        (tituloForDuration.includes('manipulacion') || tituloForDuration.includes('manipulación')) &&
        tituloForDuration.includes('alimentos') ||
        (tituloForDuration.includes('primeros') && tituloForDuration.includes('auxilios'))
    ) {
         allianceCompany = 'IPS CONFIANZA.';
    } else if (
        (tituloForDuration.includes('curso') && (tituloForDuration.includes('basico') || tituloForDuration.includes('básico')) && tituloForDuration.includes('transporte') &&
        (tituloForDuration.includes('mercancias') || tituloForDuration.includes('mercancías')) &&
        tituloForDuration.includes('peligrosas')) || (tituloForDuration.includes('transporte') &&
        (tituloForDuration.includes('mercancias') || tituloForDuration.includes('mercancías')) &&
        tituloForDuration.includes('peligrosas'))
    ) {
        allianceCompany = 'CEASAROTO.';
    }

    const t4 = allianceCompany;
    
    const w1 = doc.font('Montserrat').widthOfString(t1);
    const w2 = doc.font('Montserrat-Bold').widthOfString(t2);
    const w3 = doc.font('Montserrat').widthOfString(t3);
    const w4 = doc.font('Montserrat-Bold').widthOfString(t4);
    const w5 = doc.font('Montserrat').widthOfString(t5);
    
    const totalWidth = w1 + w2 + w3 + w4 + w5;
    
    // Target Center is 396 (792/2). Shifted left by 125 (moved 25px right from 150).
    // Start X = TargetCenter - (TotalWidth / 2)
    const targetCenterX = (792 / 2);
    let currentX = targetCenterX - (totalWidth / 2);
    
    doc.fillColor('#292561');
    
    doc.font('Montserrat').text(t1, currentX, footerTextY, { continued: false, lineBreak: false });
    currentX += w1;
    
    doc.font('Montserrat-Bold').text(t2, currentX, footerTextY, { continued: false, lineBreak: false });
    currentX += w2;
    
    doc.font('Montserrat').text(t3, currentX, footerTextY, { continued: false, lineBreak: false });
    currentX += w3;
    
    doc.font('Montserrat-Bold').text(t4, currentX, footerTextY, { continued: false, lineBreak: false });
    currentX += w4;
    
    doc.font('Montserrat').text(t5, currentX, footerTextY, { continued: false, lineBreak: false });

  
    doc.fillColor('#292561'); // Reset to #292561

    doc.end();
    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
  }

  private async addCertificateBackground(doc: any, capacitacion: any): Promise<void> {
    try {
        let backgroundName = 'fondoGeneral.svg'; // Default value (Por defecto)

        if (capacitacion?.titulo) {
            const titulo = capacitacion.titulo.toLowerCase();

            // Logic: Alimentos -> Fondo Alimentos
            // "debe incluir manipulación y alimentos o primeros auxilios"
            if (
                (titulo.includes('manipulación') && titulo.includes('alimentos')) ||
                (titulo.includes('primeros') && titulo.includes('auxilios'))
            ) {
                backgroundName = 'fondoAlimentos.svg';
            }
            // Logic: Sustancias / Mercancías Peligrosas -> Fondo Sustancias
            // "debe incluir transporte, mercancias y peligrosas"
            else if (
                (titulo.includes('curso') && (titulo.includes('basico') || titulo.includes('básico')) && titulo.includes('transporte') &&
                (titulo.includes('mercancias') || titulo.includes('mercancías')) &&
                titulo.includes('peligrosas')) || (titulo.includes('transporte') &&
                (titulo.includes('mercancias') || titulo.includes('mercancías')) &&
                titulo.includes('peligrosas'))
            ) {
                 backgroundName = 'fondoSustanciasP.svg';
            }
            // Else -> Default is already set to fondoGeneral.svg
        }
        
        const backgroundPath = join(PUBLIC_ASSETS_PATH, backgroundName);

      if (existsSync(backgroundPath)) {
        // REVERT TO RASTER (High-DPI) due to crash with vector background
        // Render raster at 300 DPI for best print quality
        const svgBuffer = readFileSync(backgroundPath);
        // Render at 300 DPI (approx 4x standard 72 DPI) for crisp quality
        const pngBuffer = await sharp(svgBuffer, { density: 300 }).png().toBuffer();
        doc.image(pngBuffer, 0, 0, { width: 792, height: 612 });
      } else {
        console.warn(`[PDF Warning] Background not found: ${backgroundPath}`);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

