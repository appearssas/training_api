import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { existsSync } from 'fs';
import { QrGeneratorService } from './qr-generator.service';
import { jsPDF } from 'jspdf';

// Types and Interfaces
import {
  PdfConfig,
  CertificateData,
  CertificateTypeFlags,
} from '../types/pdf-config.interface';

// Constants
import { PDF_CONFIG } from '../constants/pdf.constants';

// Utilities
import { svgToImage } from '../utils/svg.utils';
import {
  getCertificateBackground,
  determineCertificateTypes,
  formatCertificateDates,
  getDuration,
} from '../utils/certificate.utils';
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
  ) {}

  async generateCertificate(
    certificado: Certificado,
    config?: PdfConfig,
  ): Promise<Buffer> {
    // Log de configuración
    this.logConfiguration(config);

    // Validación de datos
    const inscripcion = certificado.inscripcion;
    if (!inscripcion || !inscripcion.capacitacion || !inscripcion.estudiante) {
      throw new Error('Datos incompletos.');
    }

    const estudiante = inscripcion.estudiante as any;
    const capacitacion = inscripcion.capacitacion as any;

    // Determinar tipos de certificado
    const certificateTypes = determineCertificateTypes(capacitacion);

    // Crear el PDF
    const doc = this.createPdfDocument();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Cargar fondo
    await this.loadBackground(doc, capacitacion, pageWidth, pageHeight);

    // Configurar fuente
    doc.setFont('helvetica');

    // Preparar datos del certificado
    const certificateData = this.prepareCertificateData(
      estudiante,
      capacitacion,
      certificado,
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
        config,
        certificateTypes,
      );
    } else {
      this.renderStandardCertificate(
        doc,
        pageWidth,
        certificateData,
        config,
        certificateTypes,
      );
    }

    // Renderizar duración y fechas
    this.renderDurationAndDates(
      doc,
      pageWidth,
      certificateData,
      config,
      certificateTypes,
    );

    // Renderizar firmas
    await renderSignatures(doc, pageWidth, config, certificateTypes);

    // Renderizar QR
    await renderQRCode(
      doc,
      certificado,
      config,
      certificateTypes,
      this.qrGeneratorService,
    );

    // Renderizar pie de página
    renderFooter(doc, pageWidth, config, certificateTypes);

    // Retornar PDF como Buffer
    return this.outputPdfAsBuffer(doc);
  }

  private logConfiguration(config?: PdfConfig): void {
    if (config) {
      console.log(
        '[PDF Generator] Config recibida:',
        JSON.stringify(config, null, 2),
      );
      console.log('[PDF Generator] Tipo de config:', typeof config);
      console.log(
        '[PDF Generator] Config.alimentos existe?',
        !!config.alimentos,
      );
      console.log(
        '[PDF Generator] Config.alimentos.cursoNombre existe?',
        !!config.alimentos?.cursoNombre,
      );
    } else {
      console.log(
        '[PDF Generator] NO se recibió config, usando valores por defecto',
      );
    }
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
        const bgImage = await svgToImage(backgroundPath, pageWidth, pageHeight);
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
      } else {
        console.warn(`[PDF Warning] Background not found: ${backgroundPath}`);
      }
    } catch (error) {
      console.error('Error loading background:', error);
    }
  }

  private prepareCertificateData(
    estudiante: any,
    capacitacion: any,
    certificado: Certificado,
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

    const certificateTypes = determineCertificateTypes(capacitacion);
    const duration: string = getDuration(
      certificateTypes.isCesaroto,
      certificateTypes.isAlimentos,
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
      certificateData.cursoNombre as string,
      configType?.cursoNombre,
      true,
    );

    // Renderizar nombre del estudiante
    renderStudentName(
      doc,
      pageWidth,
      certificateData.nombreCompleto as string,
      configType?.nombreEstudiante,
    );

    // Renderizar documento
    renderDocumentId(
      doc,
      pageWidth,
      certificateData.documento as string,
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
      certificateData.cursoNombre as string,
      configType?.cursoNombre,
      false,
    );

    // Renderizar nombre del estudiante
    renderStudentName(
      doc,
      pageWidth,
      certificateData.nombreCompleto as string,
      configType?.nombreEstudiante,
    );

    // Renderizar documento
    renderDocumentId(
      doc,
      pageWidth,
      certificateData.documento as string,
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
      certificateData.duration as string,
      certificateData.fechaEmision as string,
      certificateData.fechaVencimiento as string,
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
