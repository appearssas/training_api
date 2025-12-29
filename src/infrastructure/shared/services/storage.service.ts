import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly storagePath: string;
  private readonly materialsPath: string;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB

  constructor(private readonly configService: ConfigService) {
    // Ruta base de storage
    this.storagePath = join(process.cwd(), 'storage');
    this.materialsPath = join(this.storagePath, 'materials');

    // Crear directorios si no existen
    this.ensureDirectoriesExist();
  }

  /**
   * Asegura que los directorios de storage existan
   */
  private ensureDirectoriesExist(): void {
    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
    if (!existsSync(this.materialsPath)) {
      mkdirSync(this.materialsPath, { recursive: true });
    }
  }

  /**
   * Valida el tipo de archivo permitido
   */
  private validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.some((type) => mimetype.includes(type));
  }

  /**
   * Genera un nombre único para el archivo
   */
  private generateFileName(originalName: string): string {
    const extension = originalName.split('.').pop();
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    return `${timestamp}-${uuid}.${extension}`;
  }

  /**
   * Guarda un archivo en el storage
   * @param file Archivo a guardar
   * @param allowedTypes Tipos MIME permitidos (ej: ['image', 'application/pdf'])
   * @returns URL relativa del archivo guardado
   */
  async saveFile(
    file: Express.Multer.File,
    allowedTypes: string[],
  ): Promise<string> {
    // Validar tamaño
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo permitido de ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Validar tipo
    if (!this.validateFileType(file.mimetype, allowedTypes)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`,
      );
    }

    // Generar nombre único
    const fileName = this.generateFileName(file.originalname);
    const filePath = join(this.materialsPath, fileName);

    try {
      // Guardar archivo
      writeFileSync(filePath, file.buffer);

      // Retornar URL relativa (será servida como /storage/materials/filename)
      return `/storage/materials/${fileName}`;
    } catch (error) {
      throw new BadRequestException(
        `Error al guardar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Guarda una imagen (PDF o imagen)
   */
  async saveImageOrPdf(file: Express.Multer.File): Promise<string> {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];
    return this.saveFile(file, allowedTypes);
  }

  /**
   * Obtiene la ruta completa del archivo
   */
  getFilePath(relativePath: string): string {
    return join(process.cwd(), relativePath);
  }

  /**
   * Verifica si un archivo existe
   */
  fileExists(relativePath: string): boolean {
    const filePath = this.getFilePath(relativePath);
    return existsSync(filePath);
  }
}
