import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * Servicio para validar URLs de videos según RF-12, RF-13, RF-14
 * Soporta YouTube, Google Drive y OneDrive
 */
@Injectable()
export class VideoUrlValidatorService {
  /**
   * Valida si una URL es de un servicio de video soportado
   * @param url URL a validar
   * @returns true si es válida, false si no
   */
  isValidVideoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    return (
      this.isYouTubeUrl(url) ||
      this.isGoogleDriveUrl(url) ||
      this.isOneDriveUrl(url)
    );
  }

  /**
   * Valida y normaliza URL de YouTube
   * Soporta formatos estándar y acortados
   */
  isYouTubeUrl(url: string): boolean {
    const youtubePatterns = [
      /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/i,
      /^https?:\/\/youtube\.com\/watch\?v=[\w-]+/i,
      /^https?:\/\/youtu\.be\/[\w-]+/i,
      /^https?:\/\/www\.youtube\.com\/embed\/[\w-]+/i,
    ];

    return youtubePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Valida URL de Google Drive
   * Debe tener permisos de "cualquiera con el enlace puede ver"
   */
  isGoogleDriveUrl(url: string): boolean {
    const googleDrivePatterns = [
      /^https?:\/\/drive\.google\.com\/file\/d\/[\w-]+\/view/i,
      /^https?:\/\/drive\.google\.com\/open\?id=[\w-]+/i,
      /^https?:\/\/docs\.google\.com\/file\/d\/[\w-]+\/edit/i,
    ];

    return googleDrivePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Valida URL de OneDrive
   * Debe tener permisos de visualización pública
   */
  isOneDriveUrl(url: string): boolean {
    const oneDrivePatterns = [
      /^https?:\/\/(.*\.)?onedrive\.live\.com\/.+$/i,
      /^https?:\/\/1drv\.ms\/.+$/i,
      /^https?:\/\/(.*\.)?sharepoint\.com\/.+$/i,
    ];

    return oneDrivePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Valida URL de video y lanza excepción si es inválida (RF-14)
   * @param url URL a validar
   * @throws BadRequestException si la URL es inválida
   */
  validateVideoUrl(url: string): void {
    if (!this.isValidVideoUrl(url)) {
      throw new BadRequestException(
        'Este video no está disponible. Por favor, contacte al administrador. La URL debe ser de YouTube, Google Drive o OneDrive con permisos públicos.',
      );
    }
  }

  /**
   * Genera iframe seguro para YouTube (RF-13)
   */
  generateYouTubeIframe(url: string): string {
    let videoId = '';

    // Extraer ID del video de diferentes formatos
    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/i,
    );
    if (youtubeMatch) {
      videoId = youtubeMatch[1];
    }

    if (!videoId) {
      throw new BadRequestException(
        'No se pudo extraer el ID del video de YouTube',
      );
    }

    return `https://www.youtube.com/embed/${videoId}`;
  }

  /**
   * Genera iframe seguro para Google Drive (RF-13)
   */
  generateGoogleDriveIframe(url: string): string {
    // Extraer ID del archivo
    const driveMatch = url.match(/\/d\/([\w-]+)/i);
    if (driveMatch) {
      const fileId = driveMatch[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    throw new BadRequestException(
      'No se pudo extraer el ID del archivo de Google Drive',
    );
  }

  /**
   * Genera iframe seguro para OneDrive (RF-13)
   */
  generateOneDriveIframe(url: string): string {
    // OneDrive requiere URL específica para embed
    // Convertir URL compartida a formato embed
    if (url.includes('onedrive.live.com')) {
      // Ya está en formato correcto o necesita conversión
      return url.replace('/redir?', '/embed?');
    }

    if (url.includes('1drv.ms')) {
      // URL corta, necesita ser expandida primero
      throw new BadRequestException(
        'Las URLs cortas de OneDrive (1drv.ms) deben ser expandidas primero. Use la URL completa del archivo compartido.',
      );
    }

    if (url.includes('sharepoint.com')) {
      // SharePoint puede requerir formato específico
      return url;
    }

    throw new BadRequestException('Formato de URL de OneDrive no soportado');
  }

  /**
   * Genera iframe seguro según el tipo de servicio (RF-13)
   */
  generateVideoIframe(url: string): string {
    if (this.isYouTubeUrl(url)) {
      return this.generateYouTubeIframe(url);
    }

    if (this.isGoogleDriveUrl(url)) {
      return this.generateGoogleDriveIframe(url);
    }

    if (this.isOneDriveUrl(url)) {
      return this.generateOneDriveIframe(url);
    }

    throw new BadRequestException('Tipo de servicio de video no soportado');
  }
}
