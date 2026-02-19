import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificateFormatsRepositoryAdapter } from './certificate-formats.repository.adapter';
import {
  CertificateFormat,
  CertificateFormatType,
} from '@/entities/certificate-formats/certificate-format.entity';
import { EnteCertificador } from '@/entities/catalogos/ente-certificador.entity';
import { CreateCertificateFormatDto } from '@/application/certificate-formats/dto/create-certificate-format.dto';
import { UpdateCertificateFormatDto } from '@/application/certificate-formats/dto/update-certificate-format.dto';
import { StorageService } from '../shared/services/storage.service';

export type CentralizedCertificateConfig = {
  activeFormatId: number;
  activo: boolean;
  config: { alimentos: any; sustancias: any; otros: any };
  fondos: {
    alimentos: string | null;
    sustancias: string | null;
    otros: string | null;
  };
  fondosAbsolute: {
    alimentos: string | null;
    sustancias: string | null;
    otros: string | null;
  };
};

/** TTL del caché de configuración activa (5 minutos) */
const ACTIVE_CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class CertificateFormatsService {
  private activeConfigCache: {
    config: any;
    centralized?: {
      activeFormatId: number;
      activo: boolean;
      config: { alimentos: any; sustancias: any; otros: any };
      fondos: {
        alimentos: string | null;
        sustancias: string | null;
        otros: string | null;
      };
      fondosAbsolute: {
        alimentos: string | null;
        sustancias: string | null;
        otros: string | null;
      };
    };
    expiresAt: number;
  } | null = null;

  constructor(
    private readonly repository: CertificateFormatsRepositoryAdapter,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    @InjectRepository(EnteCertificador)
    private readonly enteCertificadorRepo: Repository<EnteCertificador>,
  ) {}

  async create(
    createDto: CreateCertificateFormatDto,
  ): Promise<CertificateFormat> {
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
      throw new NotFoundException(
        `Formato de certificado con ID ${id} no encontrado`,
      );
    }
    return format;
  }

  async findByType(
    tipo: CertificateFormatType,
  ): Promise<CertificateFormat | null> {
    return await this.repository.findByType(tipo);
  }

  async findActive(): Promise<CertificateFormat | null> {
    return await this.repository.findActive();
  }

  async update(
    id: number,
    updateDto: UpdateCertificateFormatDto,
  ): Promise<CertificateFormat> {
    await this.findOne(id);
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
   * Convierte el nombre del ente en un slug para el archivo (ej. "Andar del Llano" -> "AndarDelLlano").
   */
  private slugFromEnteName(nombre: string): string {
    return nombre
      .trim()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .split(/\s+/)
      .map(
        (s) =>
          s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/\W/g, ''),
      )
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '') || 'Formato';
  }

  /**
   * Sube o actualiza el fondo de un formato por ID.
   * Se guarda en storage/certificates (local) o S3 con nombre por ente (ej. fondoAndarDelLlano.png).
   */
  async uploadBackgroundForFormat(
    formatId: number,
    file: Express.Multer.File,
  ): Promise<CertificateFormat> {
    if (!file.mimetype || !file.mimetype.includes('image/png')) {
      throw new BadRequestException('El archivo debe ser una imagen PNG');
    }
    await this.findOne(formatId);
    const ente = await this.enteCertificadorRepo.findOne({
      where: { certificateFormatId: formatId },
    });
    const slug =
      ente?.nombre != null
        ? this.slugFromEnteName(ente.nombre)
        : `Formato${formatId}`;
    const fileNameWithoutExt = `fondo${slug}`;
    const pathOrUrl = await this.storageService.saveCertificateFormatFondo(
      file,
      fileNameWithoutExt,
    );
    const result = await this.repository.updateFondoPathByFormatId(
      formatId,
      pathOrUrl,
    );
    this.invalidateActiveConfigCache();
    return result;
  }

  /**
   * Sube o actualiza un archivo PNG de fondo para el formato activo (legacy).
   * Guarda en storage/certificates o S3 y actualiza el único fondo del formato activo.
   */
  async uploadBackground(
    tipo: CertificateFormatType,
    file: Express.Multer.File,
  ): Promise<CertificateFormat> {
    if (!file.mimetype || !file.mimetype.includes('image/png')) {
      throw new BadRequestException('El archivo debe ser una imagen PNG');
    }
    let fileNameWithoutExt: string;
    switch (tipo) {
      case CertificateFormatType.ALIMENTOS:
        fileNameWithoutExt = 'fondoAlimentos';
        break;
      case CertificateFormatType.SUSTANCIAS:
        fileNameWithoutExt = 'fondoSustanciasP';
        break;
      case CertificateFormatType.OTROS:
        fileNameWithoutExt = 'fondoGeneral';
        break;
      default: {
        const invalid = tipo as string;
        throw new BadRequestException(`Tipo de formato no válido: ${invalid}`);
      }
    }
    const pathOrUrl = await this.storageService.saveCertificateFormatFondo(
      file,
      fileNameWithoutExt,
    );
    const result = await this.repository.updateBackgroundPath(tipo, pathOrUrl);
    this.invalidateActiveConfigCache();
    return result;
  }

  /**
   * Obtiene la configuración activa como PdfConfig (con caché para PDF on-demand).
   * Incluye datos de instructor y representante legal que cambian poco.
   */
  async getActiveConfig(): Promise<any> {
    const centralized = await this.getCentralizedCertificateConfig();
    return centralized?.config ?? null;
  }

  /**
   * Construye la estructura centralizada a partir de un formato (un solo fondo por formato).
   * fondosAbsolute: ruta absoluta local o URL (S3/CloudFront) para cargar la imagen en el PDF.
   */
  private buildCentralizedFromFormat(
    format: CertificateFormat,
  ): CentralizedCertificateConfig {
    const pathOrUrl = format.fondoPath
      ? this.storageService.getFilePath(format.fondoPath)
      : null;
    return {
      activeFormatId: format.id,
      activo: !!format.activo,
      config: {
        alimentos: format.config,
        sustancias: format.config,
        otros: format.config,
      },
      fondos: {
        alimentos: format.fondoPath,
        sustancias: format.fondoPath,
        otros: format.fondoPath,
      },
      fondosAbsolute: {
        alimentos: pathOrUrl,
        sustancias: pathOrUrl,
        otros: pathOrUrl,
      },
    };
  }

  /**
   * Configuración centralizada por ID de formato (para vista previa del editor).
   */
  async getCentralizedConfigByFormatId(
    formatId: number,
  ): Promise<CentralizedCertificateConfig | null> {
    const format = await this.findOne(formatId);
    return format ? this.buildCentralizedFromFormat(format) : null;
  }

  /**
   * Configuración centralizada por ente certificador. Si enteId es null o el ente no tiene formato asignado, usa el formato activo global.
   */
  async getCentralizedConfigForEnte(
    enteId: number | null,
  ): Promise<CentralizedCertificateConfig | null> {
    if (enteId != null) {
      const ente = await this.enteCertificadorRepo.findOne({
        where: { id: enteId },
        relations: ['certificateFormat'],
      });
      if (ente?.certificateFormat) {
        return this.buildCentralizedFromFormat(ente.certificateFormat);
      }
      if (process.env.STAGE !== 'prod') {
        console.warn(
          `[CertificateFormats] Ente ${enteId} sin formato asignado; usando formato global`,
        );
      }
    }
    return this.getCentralizedCertificateConfig();
  }

  /**
   * Configuración centralizada del certificado: formato activo con config PDF y rutas de fondos.
   * Una sola fuente de verdad para generación de PDF y para la UI de administración.
   */
  async getCentralizedCertificateConfig(): Promise<CentralizedCertificateConfig | null> {
    const now = Date.now();
    if (
      this.activeConfigCache &&
      this.activeConfigCache.expiresAt > now &&
      this.activeConfigCache.centralized
    ) {
      return this.activeConfigCache.centralized;
    }

    const format = await this.repository.findActive();
    if (!format) {
      this.activeConfigCache = null;
      return null;
    }

    const centralized = this.buildCentralizedFromFormat(format);
    this.activeConfigCache = {
      config: centralized.config,
      centralized,
      expiresAt: now + ACTIVE_CONFIG_CACHE_TTL_MS,
    };
    return centralized;
  }

  /**
   * Devuelve la ruta absoluta del fondo a usar según el tipo de certificado (alimentos/sustancias/otros).
   */
  async getBackgroundPathForCertificateType(
    tipo: 'alimentos' | 'sustancias' | 'otros',
  ): Promise<string | null> {
    const centralized = await this.getCentralizedCertificateConfig();
    if (!centralized?.fondosAbsolute) return null;
    return centralized.fondosAbsolute[tipo];
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

    return format.config ?? null;
  }
}
