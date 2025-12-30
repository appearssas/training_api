import { Injectable, BadRequestException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from './s3.service';

@Injectable()
export class StorageService {
  private readonly storagePath: string;
  private readonly materialsPath: string;
  private readonly certificatesPath: string;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly useS3: boolean;

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly s3Service?: S3Service | null,
  ) {
    // Verificar si se debe usar S3
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.useS3 = !!(bucketName && accessKeyId && secretAccessKey && this.s3Service);

    if (!this.useS3) {
      // Ruta base de storage - usar variable de entorno o ruta por defecto
      // En Render, el disco se monta en /app/data, configurar STORAGE_PATH=/app/data
      const baseStoragePath = this.configService.get<string>('STORAGE_PATH') || join(process.cwd(), 'storage');
      this.storagePath = baseStoragePath;
      this.materialsPath = join(this.storagePath, 'materials');
      this.certificatesPath = join(this.storagePath, 'certificates');

      // Crear directorios si no existen
      this.ensureDirectoriesExist();
    } else {
      // Valores dummy cuando se usa S3
      this.storagePath = '';
      this.materialsPath = '';
      this.certificatesPath = '';
    }
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
    if (!existsSync(this.certificatesPath)) {
      mkdirSync(this.certificatesPath, { recursive: true });
    }
  }

  /**
   * Valida el tipo de archivo permitido
   */
  private validateFileType(
    mimetype: string,
    allowedTypes: string[],
  ): boolean {
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
   * Guarda un archivo en el storage (local o S3)
   * @param file Archivo a guardar
   * @param allowedTypes Tipos MIME permitidos (ej: ['image', 'application/pdf'])
   * @returns URL del archivo guardado (relativa si es local, completa si es S3/CloudFront)
   */
  async saveFile(
    file: Express.Multer.File,
    allowedTypes: string[],
    folder: 'materials' | 'certificates' = 'materials',
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

    // Si está configurado S3, usar S3
    if (this.useS3 && this.s3Service) {
      try {
        return await this.s3Service.uploadFile(file, folder);
      } catch (error) {
        throw new BadRequestException(
          `Error al subir archivo a S3: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        );
      }
    }

    // Guardar localmente
    const fileName = this.generateFileName(file.originalname);
    const filePath = folder === 'materials' 
      ? join(this.materialsPath, fileName)
      : join(this.certificatesPath, fileName);

    try {
      // Guardar archivo
      writeFileSync(filePath, file.buffer);

      // Retornar URL relativa (será servida como /storage/materials/filename)
      return `/storage/${folder}/${fileName}`;
    } catch (error) {
      throw new BadRequestException(
        `Error al guardar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Guarda una imagen (PDF o imagen)
   */
  async saveImageOrPdf(file: Express.Multer.File, folder: 'materials' | 'certificates' = 'materials'): Promise<string> {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];
    return this.saveFile(file, allowedTypes, folder);
  }

  /**
   * Guarda un buffer (útil para certificados PDF generados)
   */
  async saveBuffer(
    buffer: Buffer,
    fileName: string,
    folder: 'materials' | 'certificates' = 'certificates',
    contentType: string = 'application/pdf',
  ): Promise<string> {
    // Si está configurado S3, usar S3
    if (this.useS3 && this.s3Service) {
      try {
        return await this.s3Service.uploadBuffer(buffer, fileName, folder, contentType);
      } catch (error) {
        throw new BadRequestException(
          `Error al subir buffer a S3: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        );
      }
    }

    // Guardar localmente
    const filePath = folder === 'materials'
      ? join(this.materialsPath, fileName)
      : join(this.certificatesPath, fileName);

    try {
      writeFileSync(filePath, buffer);
      return `/storage/${folder}/${fileName}`;
    } catch (error) {
      throw new BadRequestException(
        `Error al guardar el buffer: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Obtiene la ruta completa del archivo
   */
  getFilePath(relativePath: string): string {
    // Si la ruta relativa ya incluye /storage, remover el prefijo
    const cleanPath = relativePath.startsWith('/storage/') 
      ? relativePath.replace('/storage/', '') 
      : relativePath;
    return join(this.storagePath, cleanPath);
  }

  /**
   * Verifica si un archivo existe
   */
  fileExists(relativePath: string): boolean {
    const filePath = this.getFilePath(relativePath);
    return existsSync(filePath);
  }
}

