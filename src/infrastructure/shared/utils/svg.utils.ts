import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PUBLIC_ASSETS_PATH, STABLE_TEXT_STYLE, PDF_CONFIG } from '../constants/pdf.constants';

const sharp = require('sharp');

/**
 * Convierte un SVG a imagen (Data URL) con alta resolución usando sharp
 * Replica exactamente el comportamiento del frontend:
 * 1. Modifica el SVG para agregar width/height explícitos
 * 2. Renderiza a 3x el tamaño objetivo
 * 3. jsPDF luego escalará esta imagen hacia abajo
 */
export async function svgToImage(
  svgPath: string,
  targetWidth: number = PDF_CONFIG.PAGE_DIMENSIONS.WIDTH,
  targetHeight: number = PDF_CONFIG.PAGE_DIMENSIONS.HEIGHT,
): Promise<string> {
  if (!existsSync(svgPath)) {
    throw new Error(`SVG file not found: ${svgPath}`);
  }

  let svg = readFileSync(svgPath, 'utf-8');

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
  svg = svg.replace(/<svg([^>]*)>/i, (match, attributes) => {
    // Remover width y height si existen
    const cleanedAttrs = attributes
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
  });

  /**
   * 🔥 Render a 3x (igual que canvas frontend)
   */
  const scale = PDF_CONFIG.SVG_SCALE;
  const renderWidth = Math.round(targetWidth * scale);
  const renderHeight = Math.round(targetHeight * scale);

  const pngBuffer = await sharp(Buffer.from(svg), {
    density: PDF_CONFIG.SVG_DENSITY,
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

export function loadFontBase64(fontFile: string): string {
  const fontPath = join(PUBLIC_ASSETS_PATH, 'fonts', fontFile);

  if (!existsSync(fontPath)) {
    throw new Error(`Font not found: ${fontPath}`);
  }

  const fontBuffer = readFileSync(fontPath);
  return fontBuffer.toString('base64');
}

export function injectMontserratFonts(svg: string): string {
  const light = loadFontBase64('Montserrat-Light.ttf');
  const bold = loadFontBase64('Montserrat-Bold.ttf');
  const extraBold = loadFontBase64('Montserrat-ExtraBold.ttf');

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