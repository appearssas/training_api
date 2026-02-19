import { readFileSync, existsSync } from 'fs';
import { QrGeneratorService } from '../services/qr-generator.service';

/** TTL del caché de imágenes (1 hora) - fondos y firmas cambian poco */
const IMAGE_CACHE_TTL_MS = 60 * 60 * 1000;

const imageCache = new Map<string, { dataUrl: string; expiresAt: number }>();

/**
 * Carga una imagen y retorna su Data URL (con caché para fondos y firmas).
 * Acepta ruta de archivo local o URL (http/https); para URLs hace fetch y convierte a base64.
 */
export async function loadImageAsDataUrl(imagePath: string): Promise<string> {
  const now = Date.now();
  const cached = imageCache.get(imagePath);
  if (cached && cached.expiresAt > now) {
    return cached.dataUrl;
  }

  try {
    const isUrl =
      imagePath.startsWith('http://') || imagePath.startsWith('https://');
    let imageBuffer: Buffer;
    let mimeType = 'image/png';

    if (isUrl) {
      const res = await fetch(imagePath);
      if (!res.ok)
        throw new Error(`Image fetch failed: ${res.status} ${imagePath}`);
      const arrayBuffer = await res.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      const contentType = res.headers.get('content-type');
      if (contentType?.startsWith('image/')) mimeType = contentType;
      else {
        const ext = new URL(imagePath).pathname.toLowerCase().split('.').pop();
        mimeType =
          ext === 'png'
            ? 'image/png'
            : ext === 'jpg' || ext === 'jpeg'
              ? 'image/jpeg'
              : 'image/png';
      }
    } else {
      if (!existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }
      imageBuffer = readFileSync(imagePath);
      const ext = imagePath.toLowerCase().split('.').pop();
      mimeType =
        ext === 'png'
          ? 'image/png'
          : ext === 'jpg' || ext === 'jpeg'
            ? 'image/jpeg'
            : 'image/png';
    }

    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    imageCache.set(imagePath, {
      dataUrl,
      expiresAt: now + IMAGE_CACHE_TTL_MS,
    });
    return dataUrl;
  } catch (error) {
    console.error('Error loading image:', error);
    throw error;
  }
}

/**
 * Genera un código QR como imagen (Data URL)
 */
export async function generateQRCodeImage(
  qrValue: string,
  qrGeneratorService: QrGeneratorService,
): Promise<string | null> {
  if (!qrValue) return null;

  try {
    // Si ya es una data URL, retornarla directamente
    if (qrValue.startsWith('data:')) {
      return qrValue;
    }

    // Usar el servicio de QR existente
    const qrBase64 = await qrGeneratorService.generateQRCode(qrValue);
    return qrBase64;
  } catch (error) {
    console.error('Error al generar QR:', error);
    return null;
  }
}
