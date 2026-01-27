import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CertificateFormatsRepositoryAdapter } from './certificate-formats.repository.adapter';
import { CertificateFormat, CertificateFormatType } from '@/entities/certificate-formats/certificate-format.entity';
import { CreateCertificateFormatDto } from '@/application/certificate-formats/dto/create-certificate-format.dto';
import { UpdateCertificateFormatDto } from '@/application/certificate-formats/dto/update-certificate-format.dto';
import { PUBLIC_ASSETS_PATH } from '../shared/constants/pdf.constants';

@Injectable()
export class CertificateFormatsService {
  private readonly backgroundsPath: string;

  constructor(
    private readonly repository: CertificateFormatsRepositoryAdapter,
    private readonly configService: ConfigService,
  ) {
    // Usar la misma ruta que los assets públicos
    this.backgroundsPath = join(PUBLIC_ASSETS_PATH);
    
    // Asegurar que el directorio existe
    if (!existsSync(this.backgroundsPath)) {
      throw new Error(
        `Directorio de assets no encontrado: ${this.backgroundsPath}`,
      );
    }
  }

  async create(createDto: CreateCertificateFormatDto): Promise<CertificateFormat> {
    return await this.repository.create(createDto);
  }

  async findAll(): Promise<CertificateFormat[]> {
    return await this.repository.findAll();
  }

  async findOne(id: number): Promise<CertificateFormat> {
    const format = await this.repository.findOne(id);
    if (!format) {
      throw new NotFoundException(`Formato de certificado con ID ${id} no encontrado`);
    }
    return format;
  }

  async findByType(tipo: CertificateFormatType): Promise<CertificateFormat | null> {
    return await this.repository.findByType(tipo);
  }

  async findActive(): Promise<CertificateFormat | null> {
    return await this.repository.findActive();
  }

  async update(
    id: number,
    updateDto: UpdateCertificateFormatDto,
  ): Promise<CertificateFormat> {
    const format = await this.findOne(id);
    return await this.repository.update(id, updateDto);
  }

  async remove(id: number): Promise<void> {
    const format = await this.findOne(id);
    await this.repository.remove(id);
  }

  /**
   * Sube o actualiza un archivo PNG de fondo para un tipo de certificado
   */
  async uploadBackground(
    tipo: CertificateFormatType,
    file: Express.Multer.File,
  ): Promise<CertificateFormat> {
    // Validar que sea un archivo PNG
    if (!file.mimetype || !file.mimetype.includes('image/png')) {
      throw new BadRequestException('El archivo debe ser una imagen PNG');
    }

    // Determinar el nombre del archivo según el tipo
    let fileName: string;
    switch (tipo) {
      case CertificateFormatType.ALIMENTOS:
        fileName = 'fondoAlimentos.png';
        break;
      case CertificateFormatType.SUSTANCIAS:
        fileName = 'fondoSustanciasP.png';
        break;
      case CertificateFormatType.OTROS:
        fileName = 'fondoGeneral.png';
        break;
      default:
        throw new BadRequestException(`Tipo de formato no válido: ${tipo}`);
    }

    const filePath = join(this.backgroundsPath, fileName);

    // Si el archivo ya existe, eliminarlo antes de guardar el nuevo
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        console.log(`[CertificateFormats] Archivo anterior eliminado: ${filePath}`);
      } catch (error) {
        console.error(
          `[CertificateFormats] Error al eliminar archivo anterior:`,
          error,
        );
      }
    }

    // Guardar el nuevo archivo
    try {
      writeFileSync(filePath, file.buffer);
      console.log(`[CertificateFormats] Archivo guardado: ${filePath}`);
    } catch (error) {
      console.error(`[CertificateFormats] Error al guardar archivo:`, error);
      throw new BadRequestException('Error al guardar el archivo PNG');
    }

    // Actualizar o crear el registro en la base de datos
    const relativePath = join('assets', fileName).replace(/\\/g, '/');
    return await this.repository.updateBackgroundPath(tipo, relativePath);
  }

  /**
   * Obtiene la configuración activa como PdfConfig
   */
  async getActiveConfig(): Promise<any> {
    const format = await this.repository.findActive();
    if (!format) {
      return null;
    }

    return {
      alimentos: format.configAlimentos,
      sustancias: format.configSustancias,
      otros: format.configOtros,
    };
  }

  /**
   * Obtiene la configuración por tipo
   */
  async getConfigByType(tipo: CertificateFormatType): Promise<any> {
    const format = await this.repository.findByType(tipo);
    if (!format) {
      return null;
    }

    switch (tipo) {
      case CertificateFormatType.ALIMENTOS:
        return format.configAlimentos;
      case CertificateFormatType.SUSTANCIAS:
        return format.configSustancias;
      case CertificateFormatType.OTROS:
        return format.configOtros;
      default:
        return null;
    }
  }
}
