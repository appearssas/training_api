import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ImageCompressionService } from '../services/image-compression.service';

/**
 * Interceptor para comprimir automáticamente cualquier archivo subido
 * Aplica compresión máxima para materiales de capacitaciones
 * Soporta: imágenes, PDFs y otros archivos comprimibles
 */
@Injectable()
export class FileCompressionInterceptor implements NestInterceptor {
  constructor(
    private readonly imageCompressionService: ImageCompressionService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;

    // Si hay un archivo, intentar comprimirlo
    if (file) {
      try {
        // Comprimir cualquier tipo de archivo
        const compressed =
          await this.imageCompressionService.compressFile(file);

        if (compressed.compressed) {
          // Reemplazar el archivo original con el comprimido
          request.file = {
            ...file,
            buffer: compressed.buffer,
            size: compressed.buffer.length,
            originalname: compressed.filename,
            mimetype: compressed.mimetype,
          };

          const reduction = (
            (1 - compressed.buffer.length / file.size) *
            100
          ).toFixed(1);
          console.log(
            `📦 Archivo comprimido: ${file.originalname} (${(file.size / 1024).toFixed(2)}KB -> ${(compressed.buffer.length / 1024).toFixed(2)}KB, -${reduction}%)`,
          );
        } else {
          console.log(
            `ℹ️ Archivo no comprimible o ya optimizado: ${file.originalname} (${(file.size / 1024).toFixed(2)}KB)`,
          );
        }
      } catch (error) {
        console.error('Error al comprimir archivo:', error);
        // Continuar con el archivo original si falla la compresión
      }
    }

    return next.handle();
  }
}
