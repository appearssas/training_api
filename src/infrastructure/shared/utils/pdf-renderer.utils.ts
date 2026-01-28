import { jsPDF } from 'jspdf';
import {
  PdfConfig,
  CertificateTypeFlags,
  DynamicDataConfig,
} from '../types/pdf-config.interface';
import { DEFAULT_VALUES } from '../constants/pdf.constants';
import { generateQRCodeImage } from './image.utils';
import { getAllianceCompany } from './certificate.utils';
import { QrGeneratorService } from '../services/qr-generator.service';
import {
  getCertificateConfig,
  getConditionalConfigValue,
} from './config-helpers.utils';
import {
  renderCourseText,
  renderStudentName,
  renderDocumentId,
} from './text-renderer.utils';
import { renderSignatures } from './signature-renderer.utils';

/**
 * Obtiene los datos dinámicos de la configuración según el tipo de certificado
 */
function getDynamicData(
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
): DynamicDataConfig | undefined {
  const certificateConfig = getCertificateConfig(config, certificateTypes);
  return certificateConfig?.dataDinamica;
}

/**
 * Renderiza duración y fechas en el PDF
 */
export function renderDuracionYFechas(
  doc: jsPDF,
  pageWidth: number,
  duration: string,
  fechaEmision: string,
  fechaVencimiento: string,
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
): void {
  const certificateConfig = getCertificateConfig(config, certificateTypes);

  // Configuración de duración
  const duracionConfig = certificateConfig?.duracion;
  const duracionX = getConditionalConfigValue(
    config,
    certificateTypes,
    'duracion',
    'x',
    pageWidth / 2,
    {
      alimentos: 440,
      sustancias: 430,
      otros: pageWidth / 2,
    },
  );
  const duracionY = duracionConfig?.y !== undefined ? duracionConfig.y : 422;
  const duracionFontSize =
    duracionConfig?.fontSize !== undefined ? duracionConfig.fontSize : 14;
  const duracionColor =
    duracionConfig?.color ?? DEFAULT_VALUES.COLORS.BLUE_DARK;
  const duracionBold =
    duracionConfig?.bold !== undefined ? duracionConfig.bold : false;

  doc.setFontSize(duracionFontSize);
  doc.setTextColor(...duracionColor);
  doc.setFont('helvetica', duracionBold ? 'bold' : 'normal');
  if (duracionX === pageWidth / 2) {
    doc.text(duration, duracionX, duracionY, { align: 'center' });
  } else {
    doc.text(duration, duracionX, duracionY);
  }

  // Configuración de fechas
  const fechaEmisionConfig = certificateConfig?.fechaEmision;
  const fechaVencimientoConfig = certificateConfig?.fechaVencimiento;

  const fechaEmisionX = getConditionalConfigValue(
    config,
    certificateTypes,
    'fechaEmision',
    'x',
    310,
    {
      alimentos: 310,
      sustancias: 240,
      otros: 310,
    },
  );
  const fechaEmisionY = getConditionalConfigValue(
    config,
    certificateTypes,
    'fechaEmision',
    'y',
    437,
    {
      alimentos: 437,
      sustancias: 438,
      otros: 437,
    },
  );
  const fechaVencimientoX = getConditionalConfigValue(
    config,
    certificateTypes,
    'fechaVencimiento',
    'x',
    570,
    {
      alimentos: 570,
      sustancias: 500,
      otros: 570,
    },
  );
  const fechaVencimientoY = getConditionalConfigValue(
    config,
    certificateTypes,
    'fechaVencimiento',
    'y',
    436,
    {
      alimentos: 436,
      sustancias: 438,
      otros: 436,
    },
  );

  const fechaFontSize =
    fechaEmisionConfig?.fontSize ?? fechaVencimientoConfig?.fontSize ?? 14;
  const fechaColor =
    fechaEmisionConfig?.color ??
    fechaVencimientoConfig?.color ??
    DEFAULT_VALUES.COLORS.BLUE_DARK;
  const fechaBold =
    fechaEmisionConfig?.bold ?? fechaVencimientoConfig?.bold ?? false;

  doc.setFontSize(fechaFontSize);
  doc.setTextColor(...fechaColor);
  doc.setFont('helvetica', fechaBold ? 'bold' : 'normal');

  // Fecha de emisión
  if (fechaEmision) {
    if (fechaEmisionX === pageWidth / 2) {
      doc.text(fechaEmision, fechaEmisionX, fechaEmisionY, {
        align: 'center',
      });
    } else {
      doc.text(fechaEmision, fechaEmisionX, fechaEmisionY);
    }
  }

  // Fecha de expiración
  if (fechaVencimiento) {
    if (fechaVencimientoX === pageWidth / 2) {
      doc.text(`${fechaVencimiento}.`, fechaVencimientoX, fechaVencimientoY, {
        align: 'center',
      });
    } else {
      doc.text(`${fechaVencimiento}.`, fechaVencimientoX, fechaVencimientoY);
    }
  }
}

/**
 * Renderiza el texto del curso en el PDF
 */
export { renderCourseText };

/**
 * Renderiza el nombre del estudiante en el PDF
 */
export { renderStudentName };

/**
 * Renderiza el documento de identidad en el PDF
 */
export { renderDocumentId };

/**
 * Renderiza las firmas en el PDF
 */
export { renderSignatures };

/**
 * Renderiza el código QR en el PDF
 */
export async function renderQRCode(
  doc: jsPDF,
  certificado: any,
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
  qrGeneratorService: QrGeneratorService,
): Promise<void> {
  const { usarConfigAlimentos, usarConfigSustancias } = certificateTypes;

  if (!certificado.hashVerificacion) return;

  try {
    const urlVerificacion = qrGeneratorService.generateVerificationUrlForQR(
      certificado.hashVerificacion as string,
    );
    const qrImage = await generateQRCodeImage(
      urlVerificacion,
      qrGeneratorService,
    );

    if (qrImage) {
      const certificateConfig = getCertificateConfig(config, certificateTypes);
      const qrConfig = certificateConfig?.qr;

      console.log('[PDF] QR Config Debug:', {
        hasConfig: !!config,
        hasCertificateConfig: !!certificateConfig,
        hasQrConfig: !!qrConfig,
        qrConfigValue: qrConfig,
        usarConfigAlimentos,
        usarConfigSustancias,
      });

      const qrSize =
        qrConfig?.size !== undefined ? qrConfig.size : DEFAULT_VALUES.QR.SIZE;
      const qrX =
        qrConfig?.x !== undefined
          ? qrConfig.x
          : usarConfigAlimentos || usarConfigSustancias
            ? DEFAULT_VALUES.QR.ALIMENTOS_POS.x
            : DEFAULT_VALUES.QR.OTROS_POS.x;
      const qrY =
        qrConfig?.y !== undefined
          ? qrConfig.y
          : usarConfigAlimentos || usarConfigSustancias
            ? DEFAULT_VALUES.QR.ALIMENTOS_POS.y
            : DEFAULT_VALUES.QR.OTROS_POS.y;

      console.log(
        '[PDF] QR - X:',
        qrX,
        'Y:',
        qrY,
        'size:',
        qrSize,
        'usarConfigAlimentos:',
        usarConfigAlimentos,
        'usarConfigSustancias:',
        usarConfigSustancias,
        'qrConfig.x:',
        qrConfig?.x,
        'qrConfig.y:',
        qrConfig?.y,
        'qrConfig.size:',
        qrConfig?.size,
      );

      doc.addImage(qrImage, 'PNG', qrX, qrY, qrSize, qrSize);
    }
  } catch (e) {
    console.error('Error generando QR dinámico:', e);
    // Fallback: intentar usar el guardado si falla el dinámico
    if (certificado.codigoQr) {
      try {
        let qrImageData = certificado.codigoQr;
        if (!qrImageData.startsWith('data:image')) {
          qrImageData = `data:image/png;base64,${qrImageData}`;
        }
        const qrSize = DEFAULT_VALUES.QR.SIZE;
        const qrX = 400;
        const qrY = 350;
        doc.addImage(qrImageData as string, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch (ex) {
        console.error('Error usando QR fallback:', ex);
      }
    }
  }
}

/**
 * Renderiza el pie de página con formato mixto
 */
export function renderFooter(
  doc: jsPDF,
  pageWidth: number,
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
): void {
  const { isAlimentos, isCesaroto } = certificateTypes;

  const certificateConfig = getCertificateConfig(config, certificateTypes);
  const footerConfig = certificateConfig?.footer;

  const footerX =
    footerConfig?.x !== undefined ? footerConfig.x : pageWidth / 2;
  const footerY =
    footerConfig?.y !== undefined
      ? footerConfig.y
      : DEFAULT_VALUES.POSITIONS.FOOTER_Y;
  const footerFontSize =
    footerConfig?.fontSize !== undefined
      ? footerConfig.fontSize
      : DEFAULT_VALUES.FONT_SIZES.TINY;
  const footerColor = footerConfig?.color ?? DEFAULT_VALUES.COLORS.BLUE_DARK;

  console.log(
    '[PDF] footer - X:',
    footerX,
    'Y:',
    footerY,
    'fontSize:',
    footerFontSize,
  );

  doc.setFontSize(footerFontSize);
  doc.setTextColor(...footerColor);

  // Obtener datos dinámicos para la empresa aliada
  const dynamicData = getDynamicData(config, certificateTypes);
  const allianceCompany = getAllianceCompany(isAlimentos, isCesaroto, dynamicData);

  // Construir el texto completo para calcular el ancho y dividir en líneas
  const footerText = `Certificado emitido por FORMAR360 en alianza con ${allianceCompany} La autenticidad de este documento puede verificarse escaneando el código QR.`;
  const footerLines = doc.splitTextToSize(footerText, pageWidth - 40);

  // Función helper para renderizar una línea con formato mixto
  const renderMixedLine = (line: string, yPos: number, isCentered: boolean) => {
    // Escapar caracteres especiales de regex en allianceCompany
    const escapedCompany = allianceCompany.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
    const regex = new RegExp(`(FORMAR360|${escapedCompany})`, 'g');
    const parts = line.split(regex);

    // Calcular el ancho total de la línea para centrado
    let totalWidth = 0;
    doc.setFont('helvetica', 'normal');
    parts.forEach((part: string) => {
      if (part === 'FORMAR360' || part === allianceCompany) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      totalWidth += doc.getTextWidth(part);
    });

    // Calcular posición inicial
    let currentX = isCentered ? footerX - totalWidth / 2 : footerX;

    // Renderizar cada parte
    parts.forEach((part: string) => {
      if (part === 'FORMAR360' || part === allianceCompany) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      if (part) {
        // Solo renderizar si la parte no está vacía
        doc.text(part, currentX, yPos);
        currentX += doc.getTextWidth(part);
      }
    });
  };

  // Renderizar cada línea
  footerLines.forEach((line: string, index: number) => {
    const yPos = footerY + index * DEFAULT_VALUES.LINE_SPACING.FOOTER;
    renderMixedLine(line, yPos, footerX === pageWidth / 2);
  });
}
