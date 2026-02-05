import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { existsSync } from 'fs';
import { loadImageAsDataUrl } from '../utils/image.utils';
import { QrGeneratorService } from './qr-generator.service';
import { jsPDF } from 'jspdf';
import { CertificateFormatsService } from '../../certificate-formats/certificate-formats.service';

// Types and Interfaces
import {
  PdfConfig,
  CertificateData,
  CertificateTypeFlags,
  DynamicDataConfig,
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

@Injectable()
export class PdfGeneratorService {
  constructor(
    private readonly configService: ConfigService,
    private readonly qrGeneratorService: QrGeneratorService,
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

    const capacitacion = inscripcion.capacitacion as any;
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

    // Renderizar firmas
    await renderSignatures(
      doc,
      pageWidth,
      configWithDefaults,
      certificateTypes,
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
    renderFooter(doc, pageWidth, configWithDefaults, certificateTypes);

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
      const backgroundPath = getCertificateBackground(capacitacion);
      if (existsSync(backgroundPath)) {
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

    // Usar certificateTypes si se proporciona, si no, determinarlo
    const types = certificateTypes || determineCertificateTypes(capacitacion);

    // Obtener datos dinámicos de la configuración según el tipo de certificado
    let dynamicData: DynamicDataConfig | undefined = undefined;
    if (config) {
      if (types.usarConfigAlimentos && config.alimentos?.dataDinamica) {
        dynamicData = config.alimentos.dataDinamica;
      } else if (
        types.usarConfigSustancias &&
        config.sustancias?.dataDinamica
      ) {
        dynamicData = config.sustancias.dataDinamica;
      } else if (config.otros?.dataDinamica) {
        dynamicData = config.otros.dataDinamica;
      }
    }

    const duration: string = getDuration(
      types.isCesaroto,
      types.isAlimentos,
      dynamicData,
    );

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
