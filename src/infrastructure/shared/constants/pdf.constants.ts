import { join } from 'path';
import { existsSync, readdirSync } from 'fs';

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
  const files = readdirSync(PUBLIC_ASSETS_PATH);
  console.log('Files in ASSETS directory:', files);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Could not list assets directory:', message);
}

export { PUBLIC_ASSETS_PATH };

export const PDF_CONFIG = {
  UNIT: 'pt' as const,
  FORMAT: 'letter' as const,
  ORIENTATION: 'landscape' as const,
  PAGE_DIMENSIONS: {
    WIDTH: 792,
    HEIGHT: 612,
  },
  SVG_SCALE: 3,
  SVG_DENSITY: 300,
} as const;

export const STABLE_TEXT_STYLE = `
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

export const DEFAULT_VALUES = {
  COLORS: {
    BLUE_DARK: [41, 37, 97] as [number, number, number],
    WHITE: [255, 255, 255] as [number, number, number],
  },
  FONT_SIZES: {
    LARGE: 18,
    MEDIUM: 14,
    SMALL: 10,
    TINY: 7,
    INSTRUCTOR_ROLE: 9.5,
    REPRESENTATIVE_NAME: 9.9,
  },
  POSITIONS: {
    FOOTER_Y: 590,
    // SIGNATURE_Y: 455,
    SIGNATURE_Y: 447,
    NAME_Y: 505,
    ROLE_Y: 513,
  },
  SIGNATURE_DIMENSIONS: {
    ALIMENTOS: { width: 145, height: 61 },
    OTROS: { width: 190, height: 80 },
  },
  LINE_SPACING: {
    FOOTER: 10,
    INSTRUCTOR_ROLE: 12,
  },
  QR: {
    SIZE: 70,
    ALIMENTOS_POS: { x: 688, y: 448.5 },
    OTROS_POS: { x: 493.8, y: 377.6 },
  },
} as const;
