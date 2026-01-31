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

/** TTL del caché de configuración activa (5 minutos) */
const ACTIVE_CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class CertificateFormatsService {
  private readonly backgroundsPath: string;
  private activeConfigCache: { config: any; expiresAt: number } | null = null;

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
    const result = await this.repository.create(createDto);
    this.invalidateActiveConfigCache();
    return result;
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
    const result = await this.repository.update(id, updateDto);
    this.invalidateActiveConfigCache();
    return result;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
    this.invalidateActiveConfigCache();
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
    const result = await this.repository.updateBackgroundPath(tipo, relativePath);
    this.invalidateActiveConfigCache();
    return result;
  }

  /**
   * Obtiene la configuración activa como PdfConfig (con caché para PDF on-demand).
   * Incluye datos de instructor y representante legal que cambian poco.
   */
  async getActiveConfig(): Promise<any> {
    const now = Date.now();
    if (
      this.activeConfigCache &&
      this.activeConfigCache.expiresAt > now
    ) {
      return this.activeConfigCache.config;
    }

    const format = await this.repository.findActive();
    if (!format) {
      this.activeConfigCache = null;
      return null;
    }

    const config = {
      alimentos: format.configAlimentos,
      sustancias: format.configSustancias,
      otros: format.configOtros,
    };
    this.activeConfigCache = {
      config,
      expiresAt: now + ACTIVE_CONFIG_CACHE_TTL_MS,
    };
    return config;
  }

  /** Invalida el caché de configuración activa (llamar al actualizar formatos) */
  invalidateActiveConfigCache(): void {
    this.activeConfigCache = null;
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
