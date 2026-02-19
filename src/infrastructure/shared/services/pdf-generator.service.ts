import { Injectable, Inject, forwardRef, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { existsSync } from 'fs';
import { join } from 'path';
import { loadImageAsDataUrl } from '../utils/image.utils';
import { PUBLIC_ASSETS_PATH } from '../constants/pdf.constants';
import { QrGeneratorService } from './qr-generator.service';
import { StorageService } from './storage.service';
import { jsPDF } from 'jspdf';
import { CertificateFormatsService } from '../../certificate-formats/certificate-formats.service';

// Types and Interfaces
import {
  PdfConfig,
  CertificateData,
  CertificateTypeFlags,
  InstructorDetails,
  RepresentativeDetails,
} from '../types/pdf-config.interface';

// Constants
import { PDF_CONFIG } from '../constants/pdf.constants';

// Utilities
// @deprecated svgToImage - Ya no se usa porque los fondos ahora son PNG directamente
// import { svgToImage } from '../utils/svg.utils';
import {
  getCertificateBackground,
  determineCertificateTypes,
  formatCertificateDates,
  getDuration,
  getInstructorDetails,
  getRepresentativeDetails,
} from '../utils/certificate.utils';
import { getConfigWithDefaults } from '../utils/config-helpers.utils';
import {
  renderDuracionYFechas,
  renderCourseText,
  renderStudentName,
  renderDocumentId,
  renderSignatures,
  renderQRCode,
  renderFooter,
} from '../utils/pdf-renderer.utils';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';

@Injectable()
export class PdfGeneratorService {
  constructor(
    private readonly configService: ConfigService,
    private readonly qrGeneratorService: QrGeneratorService,
    @Optional() private readonly storageService?: StorageService,
    @Inject(forwardRef(() => CertificateFormatsService))
    private readonly certificateFormatsService?: CertificateFormatsService,
  ) {}

  async generateCertificate(
    certificado: Certificado,
    config?: PdfConfig,
  ): Promise<Buffer> {
    // Determinar tipos de certificado primero para aplicar valores por defecto correctos
    const inscripcion = certificado.inscripcion;
    if (!inscripcion || !inscripcion.capacitacion || !inscripcion.estudiante) {
      // Validación básica antes de determinar tipos
      if (!inscripcion) {
        console.error(
          '[PDF Generator] Error: certificado.inscripcion es null/undefined',
        );
        console.error('[PDF Generator] Certificado ID:', certificado.id);
        throw new Error(
          'Datos incompletos: falta la inscripción asociada al certificado.',
        );
      }
      if (!inscripcion.capacitacion) {
        console.error(
          '[PDF Generator] Error: inscripcion.capacitacion es null/undefined',
        );
        console.error('[PDF Generator] Inscripción ID:', inscripcion.id);
        throw new Error(
          'Datos incompletos: falta la capacitación asociada a la inscripción.',
        );
      }
      if (!inscripcion.estudiante) {
        console.error(
          '[PDF Generator] Error: inscripcion.estudiante es null/undefined',
        );
        console.error('[PDF Generator] Inscripción ID:', inscripcion.id);
        throw new Error(
          'Datos incompletos: falta el estudiante asociado a la inscripción.',
        );
      }
    }

    const capacitacion = inscripcion.capacitacion;

    // Config y tipo siempre desde BD: formato del ente certificador (o formato activo global).
    // No se infiere el tipo desde la capacitación; se usa el formato asignado al ente.
    let configToUse: PdfConfig | undefined;
    const defaultCertificateTypes: CertificateTypeFlags = {
      isAlimentos: false,
      isCesaroto: false,
      isSustanciasPeligrosas: false,
      usarConfigAlimentos: false,
      usarConfigSustancias: false,
    };
    let certificateTypes: CertificateTypeFlags = defaultCertificateTypes;

    if (this.certificateFormatsService) {
      try {
        const centralized =
          await this.certificateFormatsService.getCentralizedConfigForEnte(
            capacitacion.enteCertificador?.id ?? null,
          );
        if (centralized?.config) {
          configToUse = centralized.config;
          certificateTypes = defaultCertificateTypes;
        }
      } catch (error) {
        if (process.env.STAGE !== 'prod') {
          console.warn(
            '[PDF Generator] Error al obtener configuración desde BD:',
            error,
          );
        }
      }
    }

    if (configToUse === undefined) {
      configToUse = config;
      certificateTypes = determineCertificateTypes(capacitacion);
    }

    const configWithDefaults = getConfigWithDefaults(
      configToUse,
      certificateTypes,
    );

    const estudiante = inscripcion.estudiante as any;

    const doc = this.createPdfDocument();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    await this.loadBackground(doc, capacitacion, pageWidth, pageHeight);

    // Logo del ente certificador (centralizado en catálogo)
    await this.renderEnteLogo(doc, capacitacion, pageWidth);

    // Configurar fuente
    doc.setFont('helvetica');

    // Preparar datos del certificado
    const certificateData = this.prepareCertificateData(
      estudiante,
      capacitacion,
      certificado,
      configWithDefaults,
      certificateTypes,
    );

    // Renderizar contenido según el tipo de certificado
    if (
      certificateTypes.usarConfigAlimentos ||
      certificateTypes.usarConfigSustancias
    ) {
      this.renderSimplifiedCertificate(
        doc,
        pageWidth,
        certificateData,
        configWithDefaults,
        certificateTypes,
      );
    } else {
      this.renderStandardCertificate(
        doc,
        pageWidth,
        certificateData,
        configWithDefaults,
        certificateTypes,
      );
    }

    // Renderizar duración y fechas
    this.renderDurationAndDates(
      doc,
      pageWidth,
      certificateData,
      configWithDefaults,
      certificateTypes,
    );

    // Renderizar firmas (instructor y representante desde BD: capacitación → ente → representantes)
    const instructorOverride = await this.buildInstructorOverride(capacitacion);
    const representativeOverride =
      await this.buildRepresentativeOverride(capacitacion);
    await renderSignatures(
      doc,
      pageWidth,
      configWithDefaults,
      certificateTypes,
      instructorOverride,
      representativeOverride,
    );

    // Renderizar QR
    await renderQRCode(
      doc,
      certificado,
      configWithDefaults,
      certificateTypes,
      this.qrGeneratorService,
    );

    // Renderizar pie de página
    renderFooter(
      doc,
      pageWidth,
      configWithDefaults,
      certificateTypes,
      capacitacion,
    );

    // Retornar PDF como Buffer
    return this.outputPdfAsBuffer(doc);
  }

  private createPdfDocument(): jsPDF {
    return new jsPDF({
      unit: PDF_CONFIG.UNIT,
      format: PDF_CONFIG.FORMAT,
      orientation: PDF_CONFIG.ORIENTATION,
    });
  }

  /**
   * Genera un PDF de vista previa (para el editor de formatos).
   * - Sin capacitación: usa dataDinamica del formato o firmas por defecto (assets).
   * - Con capacitación: usa instructor y representante reales del curso.
   */
  async generatePreviewPdf(
    formatId: number,
    config?: PdfConfig,
    courseName?: string,
    capacitacion?: Capacitacion | null,
  ): Promise<Buffer> {
    if (!this.certificateFormatsService) {
      throw new Error('CertificateFormatsService no disponible');
    }
    const centralized =
      await this.certificateFormatsService.getCentralizedConfigByFormatId(
        formatId,
      );
    if (!centralized) {
      throw new Error(`Formato ${formatId} no encontrado`);
    }
    const certificateTypes: CertificateTypeFlags = {
      isAlimentos: false,
      isCesaroto: false,
      isSustanciasPeligrosas: false,
      usarConfigAlimentos: false,
      usarConfigSustancias: false,
    };
    const configToUse = config ?? centralized.config;
    const configWithDefaults = getConfigWithDefaults(
      configToUse,
      certificateTypes,
    );
    const mockData: CertificateData = {
      nombreCompleto: 'ESTUDIANTE DE EJEMPLO',
      documento: '12345678',
      cursoNombre: (courseName || 'CURSO DE EJEMPLO').toUpperCase(),
      fechaEmision: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      }),
      fechaVencimiento: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      }),
      duration: '40',
    };
    const doc = this.createPdfDocument();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const backgroundPath = centralized.fondosAbsolute?.otros ?? null;
    const hasBackground =
      backgroundPath &&
      (backgroundPath.startsWith('http') || existsSync(backgroundPath));
    if (hasBackground) {
      const bgImage = await loadImageAsDataUrl(backgroundPath!);
      doc.addImage(
        bgImage,
        'PNG',
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        'SLOW',
      );
    }
    doc.setFont('helvetica');
    this.renderStandardCertificate(
      doc,
      pageWidth,
      mockData,
      configWithDefaults,
      certificateTypes,
    );
    this.renderDurationAndDates(
      doc,
      pageWidth,
      mockData,
      configWithDefaults,
      certificateTypes,
    );

    // Firmas: si hay capacitación real, instructor y representante del curso; si no, dataDinamica o defaults
    const dynamicData = configWithDefaults.otros?.dataDinamica;
    let instructorPreview: InstructorDetails | undefined;
    let representativePreview: RepresentativeDetails | undefined;

    if (capacitacion) {
      instructorPreview =
        (await this.buildInstructorOverride(capacitacion)) ?? undefined;
      representativePreview =
        (await this.buildRepresentativeOverride(capacitacion)) ?? undefined;
    }

    if (instructorPreview === undefined) {
      instructorPreview = getInstructorDetails(false, dynamicData);
      if (!instructorPreview.signatureImage && instructorPreview.name) {
        const defaultPath = join(PUBLIC_ASSETS_PATH, 'firma_viviana_rojas.png');
        instructorPreview = {
          ...instructorPreview,
          signatureImage: existsSync(defaultPath) ? defaultPath : '',
        };
      }
    }
    if (representativePreview === undefined) {
      representativePreview = getRepresentativeDetails(null, dynamicData);
      if (
        !representativePreview.signatureImage &&
        !representativePreview.name
      ) {
        const defaultPath = join(PUBLIC_ASSETS_PATH, 'firma_viviana_rojas.png');
        representativePreview = {
          name: 'Viviana Paola Rojas Hincapie',
          role: 'Representante Legal',
          signatureImage: existsSync(defaultPath) ? defaultPath : '',
        };
      }
    }

    await renderSignatures(
      doc,
      pageWidth,
      configWithDefaults,
      certificateTypes,
      instructorPreview ?? null,
      representativePreview ?? null,
    );

    // QR mock (UUID de vista previa para que el código sea escaneable)
    const mockCertificadoForQr = {
      hashVerificacion: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    };
    await renderQRCode(
      doc,
      mockCertificadoForQr,
      configWithDefaults,
      certificateTypes,
      this.qrGeneratorService,
    );

    renderFooter(doc, pageWidth, configWithDefaults, certificateTypes, null);

    return this.outputPdfAsBuffer(doc);
  }

  private async loadBackground(
    doc: jsPDF,
    capacitacion: any,
    pageWidth: number,
    pageHeight: number,
  ): Promise<void> {
    try {
      let backgroundPath: string | null = null;
      if (this.certificateFormatsService) {
        const centralized =
          await this.certificateFormatsService.getCentralizedConfigForEnte(
            capacitacion.enteCertificador?.id ?? null,
          );
        // Un solo fondo por formato en BD; usamos el del formato del ente.
        if (centralized?.fondosAbsolute) {
          backgroundPath =
            centralized.fondosAbsolute.otros ??
            centralized.fondosAbsolute.alimentos ??
            centralized.fondosAbsolute.sustancias;
        }
      }
      if (!backgroundPath) {
        backgroundPath = getCertificateBackground(capacitacion);
      }
      const hasBackground =
        backgroundPath &&
        (backgroundPath.startsWith('http') || existsSync(backgroundPath));
      if (hasBackground) {
        const bgImage = await loadImageAsDataUrl(backgroundPath!);
        doc.addImage(
          bgImage,
          'PNG',
          0,
          0,
          pageWidth,
          pageHeight,
          undefined,
          'SLOW',
        );
      }
    } catch (error) {
      if (process.env.STAGE !== 'prod') {
        console.error('Error loading background:', error);
      }
    }
  }

  private prepareCertificateData(
    estudiante: any,
    capacitacion: any,
    certificado: Certificado,
    config?: PdfConfig,
    certificateTypes?: CertificateTypeFlags,
  ): CertificateData {
    void config;
    void certificateTypes;
    const nombreCompleto: string =
      estudiante?.nombres && estudiante?.apellidos
        ? `${estudiante.nombres} ${estudiante.apellidos}`.toUpperCase()
        : 'ESTUDIANTE';
    const documento: string = estudiante?.numeroDocumento || 'N/A';
    const cursoNombre: string = (
      capacitacion?.titulo || 'CURSO SIN NOMBRE'
    ).toUpperCase();

    const {
      fechaEmision,
      fechaVencimiento,
    }: { fechaEmision: string; fechaVencimiento: string } =
      formatCertificateDates(
        certificado.fechaEmision,
        certificado.fechaVencimiento,
      );

    const duration: string = getDuration(capacitacion);

    const result: CertificateData = {
      nombreCompleto,
      documento,
      cursoNombre,
      fechaEmision,
      fechaVencimiento,
      duration,
    };
    return result;
  }

  private renderSimplifiedCertificate(
    doc: jsPDF,
    pageWidth: number,
    certificateData: CertificateData,
    config: PdfConfig | undefined,
    certificateTypes: CertificateTypeFlags,
  ): void {
    const configType = certificateTypes.usarConfigAlimentos
      ? config?.alimentos
      : certificateTypes.usarConfigSustancias
        ? config?.sustancias
        : config?.otros;

    // Renderizar nombre del curso
    renderCourseText(
      doc,
      pageWidth,
      certificateData.cursoNombre,
      configType?.cursoNombre,
      true,
    );

    // Renderizar nombre del estudiante
    renderStudentName(
      doc,
      pageWidth,
      certificateData.nombreCompleto,
      configType?.nombreEstudiante,
    );

    // Renderizar documento
    renderDocumentId(
      doc,
      pageWidth,
      certificateData.documento,
      configType?.documento,
      certificateTypes,
    );
  }

  private renderStandardCertificate(
    doc: jsPDF,
    pageWidth: number,
    certificateData: CertificateData,
    config: PdfConfig | undefined,
    certificateTypes: CertificateTypeFlags,
  ): void {
    // Para certificados estándar, usar la configuración de "otros"
    const configType = config?.otros;

    // Renderizar nombre del curso
    renderCourseText(
      doc,
      pageWidth,
      certificateData.cursoNombre,
      configType?.cursoNombre,
      false,
    );

    // Renderizar nombre del estudiante
    renderStudentName(
      doc,
      pageWidth,
      certificateData.nombreCompleto,
      configType?.nombreEstudiante,
    );

    // Renderizar documento
    renderDocumentId(
      doc,
      pageWidth,
      certificateData.documento,
      configType?.documento,
      certificateTypes,
    );
  }

  private renderDurationAndDates(
    doc: jsPDF,
    pageWidth: number,
    certificateData: CertificateData,
    config: PdfConfig | undefined,
    certificateTypes: CertificateTypeFlags,
  ): void {
    renderDuracionYFechas(
      doc,
      pageWidth,
      certificateData.duration,
      certificateData.fechaEmision,
      certificateData.fechaVencimiento,
      config,
      certificateTypes,
    );
  }

  /** Dibuja el logo del ente certificador si existe (esquina superior derecha). */
  private async renderEnteLogo(
    doc: jsPDF,
    capacitacion: any,
    pageWidth: number,
  ): Promise<void> {
    const ente = capacitacion?.enteCertificador;
    if (!ente?.logoPath || !this.storageService) return;
    const exists = await this.storageService.fileExists(
      ente.logoPath as string,
    );
    if (!exists) return;
    try {
      const absPathOrUrl = this.storageService.getFilePath(
        ente.logoPath as string,
      );
      const img = await loadImageAsDataUrl(absPathOrUrl);
      const w = 100;
      const h = 45;
      const x = pageWidth - w - 40;
      const y = 25;
      doc.addImage(img, 'PNG', x, y, w, h);
    } catch {
      // ignorar si no se puede cargar el logo
    }
  }

  /**
   * Si el ente certificador de la capacitación tiene representantes en BD,
   * devuelve el primero activo (nombre, cargo y firma si existe) para el PDF.
   */
  private async buildRepresentativeOverride(
    capacitacion: Capacitacion,
  ): Promise<RepresentativeDetails | undefined> {
    const representantes = capacitacion?.enteCertificador?.representantes;
    if (!Array.isArray(representantes) || representantes.length === 0) {
      return undefined;
    }
    const rep = representantes.find(
      (r: { activo?: boolean }) => r.activo !== false,
    );
    if (!rep) return undefined;

    const name = (rep as { nombre?: string | null }).nombre?.trim() ?? '';
    const role = (rep as { cargo?: string | null }).cargo?.trim() ?? '';

    let signatureImage = '';
    const repFirmaPath = (
      rep as { firmaPath?: string | null }
    ).firmaPath?.trim();
    if (repFirmaPath && this.storageService) {
      const exists = await this.storageService.fileExists(repFirmaPath);
      if (exists) {
        signatureImage = this.storageService.getFilePath(repFirmaPath);
      }
    }

    return { name, role, signatureImage };
  }

  /**
   * Si la capacitación tiene instructor asignado (tabla instructores), devuelve nombre desde
   * instructor.persona y rol/firma desde el propio instructor para el PDF.
   */
  private async buildInstructorOverride(
    capacitacion: Capacitacion,
  ): Promise<InstructorDetails | undefined> {
    const instructor = capacitacion?.instructor;
    const persona = instructor?.persona;
    if (!instructor || !persona) return undefined;

    const name =
      [persona.nombres, persona.apellidos].filter(Boolean).join(' ').trim() ||
      'Instructor';
    const parts: string[] = [];
    const rol =
      instructor.rol?.trim() || instructor.especialidad?.trim();
    if (rol) parts.push(`${rol}`);
    if (instructor.tarjetaProfesional?.trim())
      parts.push(`${instructor.tarjetaProfesional.trim()}`);
    if (instructor.licencia?.trim())
      parts.push(`${instructor.licencia.trim()}`);
    const role = parts.length > 0 ? parts.join('\n') : 'Instructor';

    let signatureImage = '';
    if (instructor.firmaPath?.trim() && this.storageService) {
      const exists = await this.storageService.fileExists(
        instructor.firmaPath,
      );
      if (exists) {
        signatureImage = this.storageService.getFilePath(
          instructor.firmaPath,
        );
      }
    }

    return { name, role, signatureImage };
  }

  private outputPdfAsBuffer(doc: jsPDF): Buffer {
    const pdfOutput = (doc as any).output('arraybuffer');

    if (pdfOutput instanceof ArrayBuffer) {
      return Buffer.from(pdfOutput);
    } else if (pdfOutput instanceof Uint8Array) {
      return Buffer.from(pdfOutput);
    } else {
      // Fallback: si retorna string base64
      const pdfBase64 =
        typeof pdfOutput === 'string' ? pdfOutput : doc.output();
      // Remover prefijo data: si existe
      const base64Data = pdfBase64.includes(',')
        ? pdfBase64.split(',')[1]
        : pdfBase64;
      return Buffer.from(base64Data, 'base64');
    }
  }
}
