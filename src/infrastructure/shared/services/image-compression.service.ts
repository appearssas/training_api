import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

@Injectable()
export class ImageCompressionService {
  /**
   * Comprime una imagen al máximo posible manteniendo calidad aceptable
   * @param buffer Buffer de la imagen original
   * @param maxSizeKB Tamaño máximo en KB (por defecto 500KB, 0 para compresión máxima)
   * @param aggressive Si es true, comprime más agresivamente
   * @returns Buffer de la imagen comprimida
   */
  async compressImage(
    buffer: Buffer,
    maxSizeKB: number = 500,
    aggressive: boolean = false,
  ): Promise<Buffer> {
    const maxSizeBytes = maxSizeKB > 0 ? maxSizeKB * 1024 : 0;
    
    // Si la imagen ya es menor al tamaño máximo y no es compresión agresiva, retornarla sin comprimir
    if (!aggressive && maxSizeBytes > 0 && buffer.length <= maxSizeBytes) {
      return buffer;
    }

    // Para compresión agresiva o máxima, siempre comprimir
    let quality = aggressive ? 60 : 90; // Calidad inicial más baja si es agresiva
    let compressedBuffer = buffer;
    let attempts = 0;
    const maxAttempts = aggressive ? 15 : 10;

    // Intentar comprimir hasta alcanzar el tamaño objetivo
    while (compressedBuffer.length > maxSizeBytes && attempts < maxAttempts) {
      const metadata = await sharp(buffer).metadata();
      const format = metadata.format;

      // Determinar formato de salida
      let sharpInstance = sharp(buffer);

      // Redimensionar si es muy grande (mantener proporción)
      // Para compresión agresiva, reducir más las dimensiones
      const maxDimension = aggressive ? 1200 : 1920;
      if (metadata.width && metadata.width > maxDimension) {
        sharpInstance = sharpInstance.resize(maxDimension, null, {
          withoutEnlargement: true,
          fit: 'inside',
        });
      } else if (metadata.height && metadata.height > maxDimension) {
        sharpInstance = sharpInstance.resize(null, maxDimension, {
          withoutEnlargement: true,
          fit: 'inside',
        });
      }

      // Comprimir según el formato
      if (format === 'jpeg' || format === 'jpg') {
        compressedBuffer = await sharpInstance
          .jpeg({ quality, progressive: true, mozjpeg: true })
          .toBuffer();
      } else if (format === 'png') {
        compressedBuffer = await sharpInstance
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
      } else if (format === 'webp') {
        compressedBuffer = await sharpInstance
          .webp({ quality })
          .toBuffer();
      } else {
        // Convertir a JPEG si es otro formato
        compressedBuffer = await sharpInstance
          .jpeg({ quality, progressive: true, mozjpeg: true })
          .toBuffer();
      }

      // Si aún es muy grande, reducir calidad
      if (maxSizeBytes > 0 && compressedBuffer.length > maxSizeBytes) {
        quality -= aggressive ? 15 : 10;
        if (quality < (aggressive ? 40 : 50)) {
          // Si la calidad es muy baja, reducir dimensiones
          const currentMetadata = await sharp(compressedBuffer).metadata();
          const targetDimension = aggressive ? 600 : 800;
          if (currentMetadata.width && currentMetadata.width > targetDimension) {
            compressedBuffer = await sharp(buffer)
              .resize(targetDimension, null, {
                withoutEnlargement: true,
                fit: 'inside',
              })
              .jpeg({ 
                quality: aggressive ? 60 : 80, 
                progressive: true, 
                mozjpeg: true 
              })
              .toBuffer();
          }
        }
      }

      attempts++;
    }

    // Si después de todos los intentos sigue siendo muy grande, usar compresión más agresiva
    if (maxSizeBytes > 0 && compressedBuffer.length > maxSizeBytes) {
      const metadata = await sharp(buffer).metadata();
      const finalDimension = aggressive ? 600 : 800;
      const finalQuality = aggressive ? 50 : 75;
      compressedBuffer = await sharp(buffer)
        .resize(finalDimension, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .jpeg({ quality: finalQuality, progressive: true, mozjpeg: true })
        .toBuffer();
    }

    return compressedBuffer;
  }

  /**
   * Comprime una imagen desde un archivo Multer
   * @param file Archivo de Multer
   * @param maxSizeKB Tamaño máximo en KB (por defecto 500KB, 0 para compresión máxima)
   * @param aggressive Si es true, comprime más agresivamente
   * @returns Buffer comprimido y nombre de archivo con extensión .jpg
   */
  async compressMulterFile(
    file: Express.Multer.File,
    maxSizeKB: number = 500,
    aggressive: boolean = false,
  ): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
    if (!file.buffer) {
      throw new Error(
        'El archivo no tiene buffer disponible. Asegúrate de usar memoryStorage() en Multer.',
      );
    }
    const compressedBuffer = await this.compressImage(file.buffer, maxSizeKB, aggressive);
    
    // Generar nombre de archivo con extensión .jpg (ya que comprimimos a JPEG)
    const originalName = file.originalname.split('.')[0];
    const filename = `${originalName}.jpg`;
    
    return {
      buffer: compressedBuffer,
      filename,
      mimetype: 'image/jpeg',
    };
  }

  /**
   * Comprime una imagen al máximo posible (para materiales de capacitaciones)
   * @param file Archivo de Multer
   * @returns Buffer comprimido y nombre de archivo con extensión .jpg
   */
  async compressImageMax(
    file: Express.Multer.File,
  ): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
    return this.compressMulterFile(file, 0, true);
  }

  /**
   * Comprime un archivo PDF optimizando su tamaño
   * Nota: Los PDFs ya suelen estar comprimidos internamente
   * Por ahora retornamos el original, pero se puede mejorar con pdf-lib en el futuro
   * @param buffer Buffer del PDF original
   * @returns Buffer del PDF (por ahora sin compresión adicional)
   */
  async compressPDF(buffer: Buffer): Promise<Buffer> {
    try {
      // Los PDFs ya suelen estar comprimidos internamente
      // Comprimir con gzip no es ideal porque los navegadores esperan PDFs normales
      // Para una optimización real, se necesitaría pdf-lib o similar para:
      // - Eliminar metadatos innecesarios
      // - Optimizar imágenes embebidas
      // - Comprimir streams de contenido
      
      // Por ahora, retornamos el original
      // TODO: Implementar optimización real con pdf-lib si es necesario
      return buffer;
    } catch (error) {
      console.warn('Error al procesar PDF, retornando original:', error);
      return buffer;
    }
  }

  /**
   * Comprime cualquier tipo de archivo usando compresión gzip
   * @param buffer Buffer del archivo original
   * @param mimetype Tipo MIME del archivo
   * @returns Buffer comprimido
   */
  async compressGenericFile(buffer: Buffer, mimetype: string): Promise<Buffer> {
    try {
      // Tipos de archivo que se benefician de compresión gzip
      const compressibleTypes = [
        'text/',
        'application/json',
        'application/javascript',
        'application/xml',
        'application/xhtml+xml',
        'application/atom+xml',
        'application/rss+xml',
      ];

      const shouldCompress = compressibleTypes.some(type => mimetype.startsWith(type));
      
      if (!shouldCompress) {
        // Para archivos binarios que no son comprimibles, retornar original
        return buffer;
      }

      // Comprimir con gzip nivel máximo
      const compressed = await gzipAsync(buffer, { level: 9 });
      
      // Solo retornar comprimido si realmente reduce el tamaño
      if (compressed.length < buffer.length * 0.9) {
        return compressed;
      }
      
      return buffer;
    } catch (error) {
      console.warn('Error al comprimir archivo genérico, retornando original:', error);
      return buffer;
    }
  }

  /**
   * Comprime cualquier archivo según su tipo (imagen, PDF, o genérico)
   * @param file Archivo de Multer
   * @returns Buffer comprimido, nombre de archivo y tipo MIME
   */
  async compressFile(
    file: Express.Multer.File,
  ): Promise<{ buffer: Buffer; filename: string; mimetype: string; compressed: boolean }> {
    const mimetype = file.mimetype?.toLowerCase() || '';
    const originalName = file.originalname.split('.')[0];
    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';

    // Comprimir imágenes
    if (mimetype.startsWith('image/')) {
      const compressed = await this.compressImageMax(file);
      return {
        ...compressed,
        compressed: true,
      };
    }

    // Procesar PDFs (por ahora sin compresión adicional, ya están optimizados)
    if (mimetype === 'application/pdf' || extension === 'pdf') {
      const processedBuffer = await this.compressPDF(file.buffer);
      
      // Los PDFs generalmente ya están comprimidos, así que no los marcamos como comprimidos
      return {
        buffer: processedBuffer,
        filename: file.originalname,
        mimetype: 'application/pdf',
        compressed: false, // PDFs ya están optimizados internamente
      };
    }

    // Comprimir otros archivos comprimibles
    const compressedBuffer = await this.compressGenericFile(file.buffer, mimetype);
    const wasCompressed = compressedBuffer.length < file.buffer.length;
    
    return {
      buffer: compressedBuffer,
      filename: wasCompressed ? `${file.originalname}.gz` : file.originalname,
      mimetype: wasCompressed ? 'application/gzip' : mimetype,
      compressed: wasCompressed,
    };
  }
}

