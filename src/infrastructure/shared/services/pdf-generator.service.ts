import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { QrGeneratorService } from './qr-generator.service';
import { jsPDF } from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

/**
 * Interfaz para configuración de posiciones y estilos del PDF (editable en tiempo real)
 */
export interface PdfConfig {
  // Alimentos
  alimentos?: {
    cursoNombre?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    nombreEstudiante?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    documento?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    duracion?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    fechaEmision?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    fechaVencimiento?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    qr?: { x?: number; y?: number; size?: number };
    footer?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
  };
  // Otros certificados
  otros?: {
    titulo?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    certificaQue?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    nombreEstudiante?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    documento?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    cursoNombre?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    duracion?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    fechaEmision?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    fechaVencimiento?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
    qr?: { x?: number; y?: number; size?: number };
    footer?: { x?: number; y?: number; fontSize?: number; color?: [number, number, number]; bold?: boolean };
  };
}

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
  ) { }

  /**
   * Convierte un SVG a imagen (Data URL) con alta resolución usando sharp
   * Replica exactamente el comportamiento del frontend:
   * 1. Modifica el SVG para agregar width/height explícitos
   * 2. Renderiza a 3x el tamaño objetivo
   * 3. jsPDF luego escalará esta imagen hacia abajo
   */
  private async svgToImage(
    svgPath: string,
    targetWidth: number = 792,
    targetHeight: number = 612
  ): Promise<string> {
    if (!existsSync(svgPath)) {
      throw new Error(`SVG file not found: ${svgPath}`);
    }

    let svg = readFileSync(svgPath, 'utf-8');

    /**
     * 🔥 FIX REAL PARA SHARP
     * Sharp NO respeta @font-face → rompe métricas
     * Solución: normalizar texto + forzar layout estable
     */
    const STABLE_TEXT_STYLE = `
    <style>
      text {
        font-family: "Montserrat", "Arial", sans-serif;
        font-weight: 400;
        font-style: normal;
        letter-spacing: 0;
        word-spacing: 0;
        white-space: pre;
        dominant-baseline: alphabetic;
        alignment-baseline: alphabetic;
        text-anchor: middle;
        text-rendering: geometricPrecision;
        shape-rendering: geometricPrecision;
      }
    </style>
    `;

    /**
     * 🔒 Asegurar width / height explícitos
     * (CRÍTICO para que sharp no reescale internamente)
     * Primero removemos width/height existentes para evitar duplicación
     */
    const viewBox = svg.match(/viewBox="([^"]+)"/);
    let targetW = targetWidth;
    let targetH = targetHeight;

    if (viewBox) {
      const [, vb] = viewBox;
      const [, , w, h] = vb.split(/\s+/);
      targetW = parseFloat(w);
      targetH = parseFloat(h);
    }

    // Remover width y height existentes del tag <svg> para evitar duplicación
    svg = svg.replace(
      /<svg([^>]*)>/i,
      (match, attributes) => {
        // Remover width y height si existen
        let cleanedAttrs = attributes
          .replace(/\s+width\s*=\s*["'][^"']*["']/gi, '')
          .replace(/\s+height\s*=\s*["'][^"']*["']/gi, '')
          .replace(/\s+/g, ' ') // Normalizar espacios múltiples
          .trim();

        // Construir el nuevo tag asegurando espacios correctos
        if (cleanedAttrs) {
          // Si hay otros atributos, agregar espacio antes de width/height
          return `<svg ${cleanedAttrs} width="${targetW}" height="${targetH}">${STABLE_TEXT_STYLE}`;
        } else {
          // Si no hay otros atributos, solo agregar width/height
          return `<svg width="${targetW}" height="${targetH}">${STABLE_TEXT_STYLE}`;
        }
      }
    );

    /**
     * 🔥 Render a 3x (igual que canvas frontend)
     */
    const scale = 3;
    const renderWidth = Math.round(targetWidth * scale);
    const renderHeight = Math.round(targetHeight * scale);

    const pngBuffer = await sharp(Buffer.from(svg), {
      density: 300,
      unlimited: true,
    })
      .resize(renderWidth, renderHeight, {
        fit: 'fill',
      })
      .png({
        quality: 100,
        compressionLevel: 6,
        palette: false,
      })
      .toBuffer();

    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  }


  private loadFontBase64(fontFile: string): string {
    const fontPath = join(PUBLIC_ASSETS_PATH, 'fonts', fontFile);

    if (!existsSync(fontPath)) {
      throw new Error(`Font not found: ${fontPath}`);
    }

    const fontBuffer = readFileSync(fontPath);
    return fontBuffer.toString('base64');
  }

  private injectMontserratFonts(svg: string): string {
    const light = this.loadFontBase64('Montserrat-Light.ttf');
    const bold = this.loadFontBase64('Montserrat-Bold.ttf');
    const extraBold = this.loadFontBase64('Montserrat-ExtraBold.ttf');

    const fontStyle = `
  <style>
  @font-face {
    font-family: 'Montserrat';
    font-weight: 300;
    font-style: normal;
    src: url("data:font/ttf;base64,${light}") format("truetype");
  }
  @font-face {
    font-family: 'Montserrat';
    font-weight: 700;
    font-style: normal;
    src: url("data:font/ttf;base64,${bold}") format("truetype");
  }
  @font-face {
    font-family: 'Montserrat';
    font-weight: 800;
    font-style: normal;
    src: url("data:font/ttf;base64,${extraBold}") format("truetype");
  }

  /* 🔥 Normalizamos TODO */
  text {
    font-family: 'Montserrat' !important;
    font-variation-settings: normal !important;
  }
  </style>
  `;

    return svg.replace(/<svg([^>]*)>/, `<svg$1>${fontStyle}`);
  }

  /**
   * Carga una imagen y retorna su Data URL
   */
  private async loadImageAsDataUrl(imagePath: string): Promise<string> {
    try {
      if (!existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      const imageBuffer = readFileSync(imagePath);
      const base64 = imageBuffer.toString('base64');

      // Determine MIME type from file extension
      const ext = imagePath.toLowerCase().split('.').pop();
      const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';

      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error loading image:', error);
      throw error;
    }
  }

  /**
   * Genera un código QR como imagen (Data URL)
   */
  private async generateQRCodeImage(qrValue: string): Promise<string | null> {
    if (!qrValue) return null;

    try {
      // Si ya es una data URL, retornarla directamente
      if (qrValue.startsWith('data:')) {
        return qrValue;
      }

      // Usar el servicio de QR existente
      const qrBase64 = await this.qrGeneratorService.generateQRCode(qrValue);
      return qrBase64;
    } catch (error) {
      console.error('Error al generar QR:', error);
      return null;
    }
  }

  /**
   * Determina el fondo del certificado basado en el título
   */
  private getCertificateBackground(capacitacion: any): string {
    let backgroundName = 'fondoGeneral.svg'; // Default

    if (capacitacion?.titulo) {
      const titulo = capacitacion.titulo.toLowerCase();

      // Logic: Alimentos -> Fondo Alimentos
      if (
        (titulo.includes('manipulación') && titulo.includes('alimentos')) ||
        (titulo.includes('manipulacion') && titulo.includes('alimentos')) ||
        (titulo.includes('primeros') && titulo.includes('auxilios'))
      ) {
        backgroundName = 'fondoAlimentos_2.svg';
      }
      // Logic: Sustancias / Mercancías Peligrosas -> Fondo Sustancias
      else if (
        (titulo.includes('transporte') &&
          (titulo.includes('mercancias') || titulo.includes('mercancías')) &&
          titulo.includes('peligrosas'))
      ) {
        backgroundName = 'fondoSustanciasP.svg';
      }
    }

    return join(PUBLIC_ASSETS_PATH, backgroundName);
  }

  /**
   * Obtiene los detalles del instructor basado en el tipo de curso
   */
  private getInstructorDetails(isAlimentos: boolean) {
    if (isAlimentos) {
      return {
        name: 'Nini Johana Peña Vanegaz',
        role: 'Instructor / Entrenador\nTSA REG xxxxxxxxx\nLicencia SST',
        signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_nini_pena.png'),
      };
    }
    return {
      name: 'Viviana Paola Rojas Hincapie',
      role: 'Instructor / Entrenador\nTSA REG xxxxxxxxx\nLicencia SST',
      signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_viviana_rojas.png'),
    };
  }

  /**
   * Obtiene los detalles del representante legal basado en el tipo de curso
   */
  private getRepresentativeDetails(isAlimentos: boolean) {
    if (isAlimentos) {
      return {
        name: 'Francy Dayany Gonzalez Galindo',
        signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_francy_gonzalez.png'),
      };
    }
    return {
      name: 'Alfonso Alejandro Velasco Reyes',
      signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_alfonso_velasco.png'),
    };
  }

  /**
   * Obtiene la compañía aliada basada en el tipo de curso
   */
  private getAllianceCompany(isAlimentos: boolean, isCesaroto: boolean): string {
    if (isAlimentos) {
      return 'IPS CONFIANZA.';
    }
    if (isCesaroto) {
      return 'CEASAROTO.';
    }
    return 'ANDAR DEL LLANO.';
  }

  /**
   * Obtiene la duración del curso basada en el tipo
   */
  private getDuration(isCesaroto: boolean, isAlimentos: boolean): string {
    if (isCesaroto) {
      return '60';
    }
    if (isAlimentos) {
      return '10';
    }
    return '20';
  }

  async generateCertificate(certificado: Certificado, config?: PdfConfig): Promise<Buffer> {
    if (config) {
      console.log('[PDF Generator] Config recibida:', JSON.stringify(config, null, 2));
      console.log('[PDF Generator] Tipo de config:', typeof config);
      console.log('[PDF Generator] Config.alimentos existe?', !!config.alimentos);
      console.log('[PDF Generator] Config.alimentos.cursoNombre existe?', !!config.alimentos?.cursoNombre);
    } else {
      console.log('[PDF Generator] NO se recibió config, usando valores por defecto');
    }
    const inscripcion = certificado.inscripcion as Inscripcion;
    if (!inscripcion || !inscripcion.capacitacion || !inscripcion.estudiante) {
      throw new Error('Datos incompletos.');
    }

    const estudiante = inscripcion.estudiante as any;
    const capacitacion = inscripcion.capacitacion as any;

    // Determinar tipo de curso
    const tituloLower = (capacitacion?.titulo || '').toLowerCase().trim();
    const isAlimentos =
      (tituloLower.includes('alimentos') && (tituloLower.includes('manipulación') || tituloLower.includes('manipulacion'))) ||
      (tituloLower.includes('primeros') && tituloLower.includes('auxilios'));
    const isCesaroto =
      tituloLower.includes('transporte') &&
      (tituloLower.includes('mercancias') || tituloLower.includes('mercancías')) &&
      tituloLower.includes('peligrosas');

    // Crear el PDF en formato landscape (792x612 puntos = Letter landscape)
    const doc = new jsPDF({
      unit: 'pt',
      format: 'letter',
      orientation: 'landscape',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Cargar el fondo SVG y agregarlo al PDF
    try {
      const backgroundPath = this.getCertificateBackground(capacitacion);
      if (existsSync(backgroundPath)) {
        const bgImage = await this.svgToImage(backgroundPath, pageWidth, pageHeight);
        // Agregar imagen: jsPDF escalará automáticamente la imagen de alta resolución (3x)
        // al tamaño especificado (pageWidth x pageHeight) sin recortar
        // El parámetro 'SLOW' asegura mejor calidad de compresión
        doc.addImage(bgImage, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'SLOW');
      } else {
        console.warn(`[PDF Warning] Background not found: ${backgroundPath}`);
      }
    } catch (error) {
      console.error('Error loading background:', error);
    }

    // Configurar fuente
    doc.setFont('helvetica');

    const nombreCompleto =
      estudiante?.nombres && estudiante?.apellidos
        ? `${estudiante.nombres} ${estudiante.apellidos}`.toUpperCase()
        : 'ESTUDIANTE';
    const documento = estudiante?.numeroDocumento || 'N/A';
    const cursoNombre = (capacitacion?.titulo || 'CURSO SIN NOMBRE').toUpperCase();

    if (isAlimentos) {
      // DISEÑO SIMPLIFICADO PARA ALIMENTOS
      // Solo mostrar: nombre del curso, nombre del alumno, documento, horas, fechas, firmas y QR

      // 1. Nombre del curso (sin cuadro azul, solo texto)
      const cursoNombreConfig = config?.alimentos?.cursoNombre;
      const cursoX = cursoNombreConfig?.x !== undefined ? cursoNombreConfig.x : pageWidth / 2;
      const cursoY = cursoNombreConfig?.y !== undefined ? cursoNombreConfig.y : 395;
      const cursoFontSize = cursoNombreConfig?.fontSize !== undefined ? cursoNombreConfig.fontSize : 18;
      const cursoColor = cursoNombreConfig?.color ?? [255, 255, 255];
      const cursoBold = cursoNombreConfig?.bold !== undefined ? cursoNombreConfig.bold : true;

      doc.setFontSize(cursoFontSize);
      doc.setTextColor(...cursoColor);
      doc.setFont('helvetica', cursoBold ? 'bold' : 'normal');
      // Si X es diferente del centro, no usar align center
      if (cursoX === pageWidth / 2) {
        doc.text(cursoNombre, cursoX, cursoY, { align: 'center' });
      } else {
        doc.text(cursoNombre, cursoX, cursoY);
      }

      // 2. Nombre del estudiante
      const nombreEstudianteConfig = config?.alimentos?.nombreEstudiante;
      const nombreX = nombreEstudianteConfig?.x !== undefined ? nombreEstudianteConfig.x : pageWidth / 2;
      const nombreY = nombreEstudianteConfig?.y !== undefined ? nombreEstudianteConfig.y : 290;
      const nombreFontSize = nombreEstudianteConfig?.fontSize !== undefined ? nombreEstudianteConfig.fontSize : 18;
      const nombreColor = nombreEstudianteConfig?.color ?? [41, 37, 97];
      const nombreBold = nombreEstudianteConfig?.bold !== undefined ? nombreEstudianteConfig.bold : true;

      doc.setFontSize(nombreFontSize);
      doc.setTextColor(...nombreColor);
      doc.setFont('helvetica', nombreBold ? 'bold' : 'normal');
      if (nombreX === pageWidth / 2) {
        doc.text(nombreCompleto, nombreX, nombreY, { align: 'center' });
      } else {
        doc.text(nombreCompleto, nombreX, nombreY);
      }

      // 3. Documento de identidad
      const documentoConfig = config?.alimentos?.documento;
      const docX = documentoConfig?.x !== undefined ? documentoConfig.x : 405;
      const docY = documentoConfig?.y !== undefined ? documentoConfig.y : 323;
      const docFontSize = documentoConfig?.fontSize !== undefined ? documentoConfig.fontSize : 18;
      const docColor = documentoConfig?.color ?? [41, 37, 97];
      const docBold = documentoConfig?.bold !== undefined ? documentoConfig.bold : false;

      doc.setFontSize(docFontSize);
      doc.setTextColor(...docColor);
      doc.setFont('helvetica', docBold ? 'bold' : 'normal');
      const docText = `${documento}`;
      if (docX === pageWidth / 2) {
        doc.text(docText, docX, docY, { align: 'center' });
      } else {
        doc.text(docText, docX, docY);
      }
    } else {
      // DISEÑO COMPLETO PARA OTROS CERTIFICADOS
      // 0. Título "CERTIFICADO DE APROBACIÓN" (Y: ~106.25pt)
      doc.setFontSize(26);
      doc.setTextColor(41, 37, 97); // #292561
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICADO DE APROBACIÓN', pageWidth / 2, 106.25, { align: 'center' });

      // 0.1. "CERTIFICA QUE:" (Y: ~222.4pt)
      doc.setFontSize(16);
      doc.setTextColor(41, 37, 97);
      doc.setFont('helvetica', 'normal');
      doc.text('CERTIFICA QUE:', pageWidth / 2, 222.4, { align: 'center' });

      // 1. Nombre del estudiante (Y: ~236.5pt, centrado)
      doc.setFontSize(18);
      doc.setTextColor(41, 37, 97);
      doc.setFont('helvetica', 'bold');
      doc.text(nombreCompleto, pageWidth / 2, 236.5, { align: 'center' });

      // 2. Documento de identidad (Y: ~257.6pt)
      doc.setFontSize(14.5);
      doc.setTextColor(41, 37, 97);
      doc.setFont('helvetica', 'normal');
      const docText = `Cedula de Ciudadanía N° ${documento}`;
      doc.text(docText, pageWidth / 2, 257.6, { align: 'center' });

      // 2.1. Texto "Ha realizado y aprobado satisfactoriamente el curso de" (Y: ~289.4pt)
      doc.setFontSize(11);
      doc.setTextColor(41, 37, 97);
      doc.setFont('helvetica', 'normal');
      doc.text('Ha realizado y aprobado satisfactoriamente el curso de', pageWidth / 2, 289.4, { align: 'center' });

      // 3. Cápsula azul del curso (Y: ~292.8pt borde superior, texto en Y: ~314.1pt)
      const capsuleX = 50;
      const capsuleY = 292.8;
      const capsuleWidth = 690.8;
      const capsuleHeight = 42.5;
      const capsuleRadius = capsuleHeight / 2;

      doc.setFillColor(41, 37, 97); // Azul oscuro
      doc.roundedRect(capsuleX, capsuleY, capsuleWidth, capsuleHeight, capsuleRadius, capsuleRadius, 'FD');

      // Texto del curso dentro de la cápsula
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255); // Blanco
      doc.setFont('helvetica', 'bold');

      // Calcular el tamaño de fuente para que quepa
      let courseFontSize = 16;
      const maxCourseWidth = 680;
      let courseTextWidth = doc.getTextWidth(cursoNombre);

      while (courseTextWidth > maxCourseWidth && courseFontSize > 11) {
        courseFontSize -= 0.5;
        doc.setFontSize(courseFontSize);
        courseTextWidth = doc.getTextWidth(cursoNombre);
      }

      doc.text(cursoNombre, pageWidth / 2, capsuleY + capsuleHeight / 2 + 2, { align: 'center' });
    }

    // 4. Duración y 5. Fechas
    const localeDateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: '2-digit' };
    const fechaEmision = certificado.fechaEmision
      ? new Date(certificado.fechaEmision).toLocaleDateString('es-ES', localeDateOptions)
      : '';
    const fechaVencimiento = certificado.fechaVencimiento
      ? new Date(certificado.fechaVencimiento).toLocaleDateString('es-ES', localeDateOptions)
      : '';

    if (isAlimentos) {
      // Para alimentos: ajustar posiciones más arriba
      // 4. Duración (Y: ~320pt, centrado)
      const duracionConfig = config?.alimentos?.duracion;
      const duracionX = duracionConfig?.x !== undefined ? duracionConfig.x : 440;
      const duracionY = duracionConfig?.y !== undefined ? duracionConfig.y : 422;
      const duracionFontSize = duracionConfig?.fontSize !== undefined ? duracionConfig.fontSize : 14;
      const duracionColor = duracionConfig?.color ?? [41, 37, 97];
      const duracionBold = duracionConfig?.bold !== undefined ? duracionConfig.bold : false;

      doc.setFontSize(duracionFontSize);
      doc.setTextColor(...duracionColor);
      doc.setFont('helvetica', duracionBold ? 'bold' : 'normal');
      const duration = this.getDuration(isCesaroto, isAlimentos);
      if (duracionX === pageWidth / 2) {
        doc.text(duration, duracionX, duracionY, { align: 'center' });
      } else {
        doc.text(duration, duracionX, duracionY);
      }

      // 5. Fechas (Y: ~340pt)
      const fechaEmisionConfig = config?.alimentos?.fechaEmision;
      const fechaVencimientoConfig = config?.alimentos?.fechaVencimiento;
      const fechaEmisionX = fechaEmisionConfig?.x !== undefined ? fechaEmisionConfig.x : 310;
      const fechaEmisionY = fechaEmisionConfig?.y !== undefined ? fechaEmisionConfig.y : 437;
      const fechaVencimientoX = fechaVencimientoConfig?.x !== undefined ? fechaVencimientoConfig.x : 570;
      const fechaVencimientoY = fechaVencimientoConfig?.y !== undefined ? fechaVencimientoConfig.y : 436;
      const fechaFontSize = fechaEmisionConfig?.fontSize ?? fechaVencimientoConfig?.fontSize ?? 14;
      const fechaColor = fechaEmisionConfig?.color ?? fechaVencimientoConfig?.color ?? [41, 37, 97];
      const fechaBold = fechaEmisionConfig?.bold ?? fechaVencimientoConfig?.bold ?? false;

      console.log('[PDF] fechas - Emision X:', fechaEmisionX, 'Y:', fechaEmisionY, 'Vencimiento X:', fechaVencimientoX, 'Y:', fechaVencimientoY, 'fontSize:', fechaFontSize, 'bold:', fechaBold);

      doc.setFontSize(fechaFontSize);
      doc.setTextColor(...fechaColor);
      doc.setFont('helvetica', fechaBold ? 'bold' : 'normal');
      // Fecha de emisión (izquierda, X: ~183.3pt)
      if (fechaEmision) {
        doc.text(fechaEmision, fechaEmisionX, fechaEmisionY, { align: 'center' });
      }
      // Fecha de expiración (derecha, X: ~422.4pt)
      if (fechaVencimiento) {
        doc.text(`${fechaVencimiento}.`, fechaVencimientoX, fechaVencimientoY, { align: 'center' });
      }
    } else {
      // Para otros certificados: posiciones originales
      // 4. Duración (Y: ~338.4pt, centrado)
      doc.setFontSize(11);
      doc.setTextColor(41, 37, 97);
      doc.setFont('helvetica', 'normal');
      const duration = this.getDuration(isCesaroto, isAlimentos);
      doc.text(duration, pageWidth / 2, 338.4, { align: 'center' });

      // 5. Fechas (Y: ~348.9pt)
      doc.setFontSize(10.5);
      doc.setTextColor(41, 37, 97);
      doc.setFont('helvetica', 'normal');
      // Fecha de emisión (izquierda, X: ~183.3pt)
      if (fechaEmision) {
        doc.text(fechaEmision, 183.3, 348.9, { align: 'center' });
      }
      // Fecha de expiración (derecha, X: ~422.4pt)
      if (fechaVencimiento) {
        doc.text(`${fechaVencimiento}.`, 422.4, 348.9, { align: 'center' });
      }
    }

    // 6. Firmas
    const instructorSig = this.getInstructorDetails(isAlimentos);

    // Imagen de firma del instructor (Y: 450pt)
    if (existsSync(instructorSig.signatureImage)) {
      try {
        const instructorSigImg = await this.loadImageAsDataUrl(instructorSig.signatureImage);
        // Ajustar tamaño según la firma (Viviana es más grande)
        const sigWidth = isAlimentos ? 145 : 190;
        const sigHeight = isAlimentos ? 61 : 80;
        const sigX = isAlimentos ? 251 - 72.5 : 251 - 95;
        doc.addImage(instructorSigImg, 'PNG', sigX, 450, sigWidth, sigHeight);
      } catch (error) {
        console.warn('No se pudo cargar la firma del instructor:', error);
      }
    }

    // Nombre del instructor (Y: 495pt)
    doc.setFontSize(10);
    doc.setTextColor(41, 37, 97);
    doc.setFont('helvetica', 'bold');
    doc.text(instructorSig.name, 235, 495, { align: 'center' });

    // Rol del instructor (Y: 513pt)
    doc.setFontSize(9.5);
    doc.setTextColor(41, 37, 97);
    doc.setFont('helvetica', 'normal');
    const roleLines = instructorSig.role.split('\n');
    roleLines.forEach((line, index) => {
      doc.text(line, 217, 513 + index * 12, { align: 'center' });
    });

    // Representante Legal (derecha, X: 571pt)
    const repSig = this.getRepresentativeDetails(isAlimentos);

    // Imagen de firma del representante (Y: 455pt)
    if (existsSync(repSig.signatureImage)) {
      try {
        const repSigImg = await this.loadImageAsDataUrl(repSig.signatureImage);
        doc.addImage(repSigImg, 'PNG', 571 - 72.5, 455, 145, 61);
      } catch (error) {
        console.warn('No se pudo cargar la firma del representante:', error);
      }
    }

    // Nombre del representante (Y: 495pt)
    doc.setFontSize(9.9);
    doc.setTextColor(41, 37, 97);
    doc.setFont('helvetica', 'bold');
    doc.text(repSig.name, 565.5, 495, { align: 'center' });

    // Rol del representante (Y: 513pt)
    doc.setFontSize(9.5);
    doc.setTextColor(41, 37, 97);
    doc.setFont('helvetica', 'normal');
    doc.text('Representante Legal', 571, 513, { align: 'center' });

    // 7. Código QR y botón de validación (X: ~493.8pt, Y: ~377.6pt borde superior)
    if (certificado.hashVerificacion) {
      try {
        const urlVerificacion = this.qrGeneratorService.generateVerificationUrlForQR(certificado.hashVerificacion);
        const qrImage = await this.generateQRCodeImage(urlVerificacion);

        if (qrImage) {
          const qrConfig = isAlimentos ? config?.alimentos?.qr : config?.otros?.qr;
          const qrSize = qrConfig?.size !== undefined ? qrConfig.size : 70;
          const qrX = qrConfig?.x !== undefined ? qrConfig.x : (isAlimentos ? 688 : 493.8);
          const qrY = qrConfig?.y !== undefined ? qrConfig.y : (isAlimentos ? 448.5 : 377.6);

          console.log('[PDF] QR - X:', qrX, 'Y:', qrY, 'size:', qrSize, 'isAlimentos:', isAlimentos);

          doc.addImage(qrImage, 'PNG', qrX, qrY, qrSize, qrSize);
        }
      } catch (e) {
        console.error('Error generando QR dinámico:', e);
        // Fallback: intentar usar el guardado si falla el dinámico
        if (certificado.codigoQr) {
          try {
            let qrImageData = certificado.codigoQr;
            if (!qrImageData.startsWith('data:image')) {
              qrImageData = `data:image/png;base64,${qrImageData}`;
            }
            const qrSize = 70;
            const qrX = 400;
            const qrY = 350;
            doc.addImage(qrImageData, 'PNG', qrX, qrY, qrSize, qrSize);
          } catch (ex) {
            console.error('Error usando QR fallback:', ex);
          }
        }
      }
    }

    // Botón de validación debajo del QR (Y: ~459.6pt borde superior)
    // const buttonX = 451.2;
    // const buttonY = 459.6;
    // const buttonWidth = 98.7;
    // const buttonHeight = 21.25;
    // const buttonRadius = buttonHeight / 2;

    // doc.setFillColor(41, 37, 97); // Azul oscuro
    // doc.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, buttonRadius, buttonRadius, 'FD');

    // Texto del botón (centrado en el botón)
    // doc.setFontSize(7);
    // doc.setTextColor(255, 255, 255); // Blanco
    // doc.setFont('helvetica', 'normal');
    // const buttonText = 'Escanea para validar el certificado';
    // const buttonCenterX = buttonX + buttonWidth / 2;
    // doc.text(buttonText, buttonCenterX, buttonY + buttonHeight / 2 + 1, { align: 'center' });

    // 8. Texto del pie de página (Y: ~576pt)
    const footerConfig = isAlimentos ? config?.alimentos?.footer : config?.otros?.footer;
    const footerX = footerConfig?.x !== undefined ? footerConfig.x : pageWidth / 2;
    const footerY = footerConfig?.y !== undefined ? footerConfig.y : 590;
    const footerFontSize = footerConfig?.fontSize !== undefined ? footerConfig.fontSize : 7;
    const footerColor = footerConfig?.color ?? [41, 37, 97];
    const footerLineSpacing = 10;

    console.log('[PDF] footer - X:', footerX, 'Y:', footerY, 'fontSize:', footerFontSize);

    doc.setFontSize(footerFontSize);
    doc.setTextColor(...footerColor);
    
    const allianceCompany = this.getAllianceCompany(isAlimentos, isCesaroto);
    
    // Construir el texto completo para calcular el ancho y dividir en líneas
    const footerText = `Certificado emitido por FORMAR360 en alianza con ${allianceCompany} La autenticidad de este documento puede verificarse escaneando el código QR.`;
    const footerLines = doc.splitTextToSize(footerText, pageWidth - 40);
    
    // Función helper para renderizar una línea con formato mixto
    const renderMixedLine = (line: string, yPos: number, isCentered: boolean) => {
      // Escapar caracteres especiales de regex en allianceCompany
      const escapedCompany = allianceCompany.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(FORMAR360|${escapedCompany})`, 'g');
      const parts = line.split(regex);
      
      // Calcular el ancho total de la línea para centrado
      let totalWidth = 0;
      doc.setFont('helvetica', 'normal');
      parts.forEach((part: string) => {
        if (part === 'FORMAR360' || part === allianceCompany) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        totalWidth += doc.getTextWidth(part);
      });
      
      // Calcular posición inicial
      let currentX = isCentered ? footerX - totalWidth / 2 : footerX;
      
      // Renderizar cada parte
      parts.forEach((part: string) => {
        if (part === 'FORMAR360' || part === allianceCompany) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        if (part) { // Solo renderizar si la parte no está vacía
          doc.text(part, currentX, yPos);
          currentX += doc.getTextWidth(part);
        }
      });
    };
    
    // Renderizar cada línea
    footerLines.forEach((line: string, index: number) => {
      const yPos = footerY + index * footerLineSpacing;
      renderMixedLine(line, yPos, footerX === pageWidth / 2);
    });

    // Retornar el PDF como Buffer
    // En jsPDF, output() sin parámetros retorna una string base64 del PDF
    // Usamos el método más directo para obtener el ArrayBuffer
    const pdfOutput = (doc as any).output('arraybuffer');

    if (pdfOutput instanceof ArrayBuffer) {
      return Buffer.from(pdfOutput);
    } else if (pdfOutput instanceof Uint8Array) {
      return Buffer.from(pdfOutput);
    } else {
      // Fallback: si retorna string base64
      const pdfBase64 = typeof pdfOutput === 'string' ? pdfOutput : doc.output();
      // Remover prefijo data: si existe
      const base64Data = pdfBase64.includes(',')
        ? pdfBase64.split(',')[1]
        : pdfBase64;
      return Buffer.from(base64Data, 'base64');
    }
  }
}
