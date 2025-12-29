import { Injectable } from '@nestjs/common';
import QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio para generar códigos QR y tokens de verificación
 * RF-24: Código QR único y seguro con UUID v4
 */
@Injectable()
export class QrGeneratorService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Genera un token único UUID v4 para verificación
   * @returns Token UUID v4
   */
  generateVerificationToken(): string {
    return uuidv4();
  }

  /**
   * Genera la URL pública de verificación
   * @param token Token de verificación
   * @returns URL pública completa
   */
  generateVerificationUrl(token: string): string {
    const baseUrl =
      this.configService.get<string>('PUBLIC_VERIFICATION_URL') ||
      this.configService.get<string>('APP_URL') ||
      'https://plataforma.com';
    return `${baseUrl}/verify/${token}`;
  }

  /**
   * Genera un código QR como imagen base64
   * @param data Datos a codificar en el QR (URL de verificación)
   * @returns Promise con la imagen QR en base64
   */
  async generateQRCode(data: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error(`Error al generar código QR: ${error.message}`);
    }
  }

  /**
   * Genera el hash de verificación a partir del token
   * @param token Token UUID
   * @returns Hash de verificación
   */
  generateVerificationHash(token: string): string {
    // Usar el token directamente como hash, o generar un hash más corto
    // Para simplificar, usamos el token completo
    return token;
  }
}
