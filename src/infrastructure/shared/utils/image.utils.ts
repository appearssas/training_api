import { readFileSync, existsSync } from 'fs';
import { QrGeneratorService } from '../services/qr-generator.service';

/**
 * Carga una imagen y retorna su Data URL
 */
export async function loadImageAsDataUrl(imagePath: string): Promise<string> {
  try {
    if (!existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    const imageBuffer = readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');

    // Determine MIME type from file extension
    const ext = imagePath.toLowerCase().split('.').pop();
    const mimeType =
      ext === 'png'
        ? 'image/png'
        : ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : 'image/png';

    return `data:${mimeType};base64,${base64}`;
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