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
   * @returns URL pública relativa (el frontend construye la URL completa)
   */
  generateVerificationUrl(token: string): string {
    // Retornar URL relativa - el frontend construirá la URL completa
    return `/verify/${token}`;
  }

  /**
   * Genera la URL pública de verificación completa (para QR)
   * @param token Token de verificación
   * @returns URL pública completa para usar en QR
   */
  generateVerificationUrlForQR(token: string): string {
    // Para el QR, necesitamos la URL completa para que funcione cuando se escanea
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 
                    this.configService.get<string>('PUBLIC_VERIFICATION_URL') || 
                    this.configService.get<string>('APP_URL') || 
                    'http://localhost:9000';
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

