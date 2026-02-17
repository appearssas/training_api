import { Injectable, Inject, forwardRef, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { existsSync } from 'fs';
import { loadImageAsDataUrl } from '../utils/image.utils';
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
    const certificateTypes = determineCertificateTypes(capacitacion);

    console.log('certificateTypes', certificateTypes);

    // Si no se proporciona config, intentar obtenerla desde la base de datos
    let configToUse = config;
    if (!configToUse && this.certificateFormatsService) {
      try {
        const dbConfig = await this.certificateFormatsService.getActiveConfig();
        if (dbConfig) configToUse = dbConfig;
      } catch (error) {
        if (process.env.STAGE !== 'prod') {
          console.warn(
            '[PDF Generator] Error al obtener configuración desde BD:',
            error,
          );
        }
      }
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
          await this.certificateFormatsService.getCentralizedCertificateConfig();
        const certificateTypes = determineCertificateTypes(capacitacion);
        if (centralized?.fondosAbsolute) {
          if (certificateTypes.usarConfigAlimentos) {
            backgroundPath = centralized.fondosAbsolute.alimentos;
          } else if (certificateTypes.usarConfigSustancias) {
            backgroundPath = centralized.fondosAbsolute.sustancias;
          } else {
            backgroundPath = centralized.fondosAbsolute.otros;
          }
        }
      }
      if (!backgroundPath) {
        backgroundPath = getCertificateBackground(capacitacion);
      }
      if (backgroundPath && existsSync(backgroundPath)) {
        const bgImage = await loadImageAsDataUrl(backgroundPath);
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
   * devuelve el primero activo con firma para el PDF.
   */
  private async buildRepresentativeOverride(
    capacitacion: Capacitacion,
  ): Promise<RepresentativeDetails | undefined> {
    if (!this.storageService) return undefined;
    const representantes = capacitacion?.enteCertificador?.representantes;
    if (!Array.isArray(representantes) || representantes.length === 0) {
      return undefined;
    }
    const rep = representantes.find(
      (r: { activo?: boolean; firmaPath?: string | null }) =>
        r.activo !== false && r.firmaPath?.trim(),
    );
    if (!rep?.firmaPath) return undefined;
    const exists = await this.storageService.fileExists(rep.firmaPath);
    if (!exists) return undefined;
    return {
      name: rep.nombre?.trim() ?? '',
      signatureImage: this.storageService.getFilePath(rep.firmaPath),
      role: (rep as { cargo?: string | null }).cargo?.trim() ?? '',
    };
  }

  /**
   * Si la capacitación tiene instructor con firma centralizada (firmaPath en BD),
   * devuelve los datos para el PDF. Si no, undefined y se usa la config del editor.
   */
  private async buildInstructorOverride(
    capacitacion: Capacitacion,
  ): Promise<InstructorDetails | undefined> {
    if (!this.storageService) return undefined;
    const instructorProfile = capacitacion?.instructor?.instructor;
    const persona = capacitacion?.instructor;
    if (!instructorProfile?.firmaPath || !persona) return undefined;
    const exists = await this.storageService.fileExists(
      instructorProfile.firmaPath as string,
    );
    if (!exists) return undefined;
    const name =
      [persona.nombres, persona.apellidos].filter(Boolean).join(' ').trim() ||
      'Instructor';
    const role = instructorProfile.especialidad?.trim() || 'Instructor';
    return {
      name,
      role,
      signatureImage: this.storageService.getFilePath(
        instructorProfile.firmaPath as string,
      ),
    };
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
