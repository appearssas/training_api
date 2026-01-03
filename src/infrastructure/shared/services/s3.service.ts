import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly cloudFrontUrl: string;
  private readonly materialsFolder: string = 'materials';
  private readonly certificatesFolder: string = 'certificates';

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || '';
    this.cloudFrontUrl = this.configService.get<string>('AWS_CLOUDFRONT_URL') || '';

    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME debe estar configurado');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  /**
   * Genera un nombre único para el archivo
   */
  private generateFileName(originalName: string, folder: string): string {
    const extension = originalName.split('.').pop();
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    return `${folder}/${timestamp}-${uuid}.${extension}`;
  }

  /**
   * Sube un archivo a S3
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: 'materials' | 'certificates' | 'avatars',
  ): Promise<string> {
    const fileName = this.generateFileName(file.originalname, folder);
    const contentType = file.mimetype || 'application/octet-stream';

    try {
      // Si se usa OAC (Origin Access Control), no se necesita ACL
      // Si el bucket es público, se puede usar ACL: 'public-read'
      // Por defecto, no usamos ACL (compatible con OAC)
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: contentType,
        // No usar ACL cuando se usa OAC (Origin Access Control)
        // Si necesitas bucket público, descomenta la siguiente línea:
        // ACL: 'public-read',
      });

      await this.s3Client.send(command);

      // Retornar URL de CloudFront si está configurado, sino URL de S3
      if (this.cloudFrontUrl) {
        // Remover trailing slash si existe
        const baseUrl = this.cloudFrontUrl.replace(/\/$/, '');
        return `${baseUrl}/${fileName}`;
      }

      // URL de S3 como fallback
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
    } catch (error) {
      throw new Error(
        `Error al subir archivo a S3: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Sube un buffer a S3 (útil para certificados PDF generados)
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    folder: 'materials' | 'certificates' | 'avatars',
    contentType: string = 'application/pdf',
  ): Promise<string> {
    const key = `${folder}/${fileName}`;

    try {
      // Si se usa OAC (Origin Access Control), no se necesita ACL
      // Si el bucket es público, se puede usar ACL: 'public-read'
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // No usar ACL cuando se usa OAC (Origin Access Control)
        // Si necesitas bucket público, descomenta la siguiente línea:
        // ACL: 'public-read',
      });

      await this.s3Client.send(command);

      // Retornar URL de CloudFront si está configurado
      if (this.cloudFrontUrl) {
        const baseUrl = this.cloudFrontUrl.replace(/\/$/, '');
        return `${baseUrl}/${key}`;
      }

      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (error) {
      throw new Error(
        `Error al subir buffer a S3: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Verifica si un archivo existe en S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Obtiene un archivo de S3
   */
  async getFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('El archivo está vacío');
      }

      // Convertir stream a buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      throw new Error(
        `Error al obtener archivo de S3: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}

