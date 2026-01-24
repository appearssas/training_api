import { jsPDF } from 'jspdf';
import { existsSync } from 'fs';
import {
  PdfConfig,
  CertificateConfig,
  ElementConfig,
  ImageConfig,
  CertificateTypeFlags,
} from '../types/pdf-config.interface';
import { DEFAULT_VALUES } from '../constants/pdf.constants';
import { loadImageAsDataUrl, generateQRCodeImage } from './image.utils';
import {
  getInstructorDetails,
  getRepresentativeDetails,
  getAllianceCompany,
} from './certificate.utils';
import { QrGeneratorService } from '../services/qr-generator.service';

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
  const { usarConfigAlimentos, usarConfigSustancias } = certificateTypes;

  // Determinar qué configuración usar
  const configType = usarConfigAlimentos
    ? config?.alimentos
    : usarConfigSustancias
      ? config?.sustancias
      : config?.otros;

  // 4. Duración
  const duracionConfig = configType?.duracion;
  const duracionX =
    duracionConfig?.x !== undefined
      ? duracionConfig.x
      : usarConfigAlimentos
        ? 440
        : usarConfigSustancias
          ? 430
          : pageWidth / 2;
  const duracionY =
    duracionConfig?.y !== undefined ? duracionConfig.y : 422;
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

  // 5. Fechas
  const fechaEmisionConfig = configType?.fechaEmision;
  const fechaVencimientoConfig = configType?.fechaVencimiento;
  const fechaEmisionX =
    fechaEmisionConfig?.x !== undefined
      ? fechaEmisionConfig.x
      : usarConfigAlimentos
        ? 310
        : usarConfigSustancias
          ? 240
          : 310;
  const fechaEmisionY =
    fechaEmisionConfig?.y !== undefined
      ? fechaEmisionConfig.y
      : usarConfigAlimentos
        ? 437
        : usarConfigSustancias
          ? 438
          : 437;
  const fechaVencimientoX =
    fechaVencimientoConfig?.x !== undefined
      ? fechaVencimientoConfig.x
      : usarConfigAlimentos
        ? 570
        : usarConfigSustancias
          ? 500
          : 570;
  const fechaVencimientoY =
    fechaVencimientoConfig?.y !== undefined
      ? fechaVencimientoConfig.y
      : usarConfigAlimentos
        ? 436
        : usarConfigSustancias
          ? 438
          : 436;
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
export function renderCourseText(
  doc: jsPDF,
  pageWidth: number,
  cursoNombre: string,
  config: ElementConfig | undefined,
  isSimplified: boolean = true,
): void {
  const cursoX =
    config?.x !== undefined ? config.x : pageWidth / 2;
  const cursoY = config?.y !== undefined ? config.y : 395;
  const cursoFontSize =
    config?.fontSize !== undefined
      ? config.fontSize
      : DEFAULT_VALUES.FONT_SIZES.LARGE;
  const cursoColor = config?.color ?? 
    (isSimplified ? DEFAULT_VALUES.COLORS.WHITE : DEFAULT_VALUES.COLORS.BLUE_DARK);
  const cursoBold = config?.bold !== undefined ? config.bold : true;

  doc.setFontSize(cursoFontSize);
  doc.setTextColor(...cursoColor);
  doc.setFont('helvetica', cursoBold ? 'bold' : 'normal');

  if (cursoX === pageWidth / 2) {
    doc.text(cursoNombre, cursoX, cursoY, { align: 'center' });
  } else {
    doc.text(cursoNombre, cursoX, cursoY);
  }
}

/**
 * Renderiza el nombre del estudiante en el PDF
 */
export function renderStudentName(
  doc: jsPDF,
  pageWidth: number,
  nombreCompleto: string,
  config: ElementConfig | undefined,
): void {
  const nombreX =
    config?.x !== undefined ? config.x : pageWidth / 2;
  const nombreY = config?.y !== undefined ? config.y : 290;
  const nombreFontSize =
    config?.fontSize !== undefined
      ? config.fontSize
      : DEFAULT_VALUES.FONT_SIZES.LARGE;
  const nombreColor = config?.color ?? DEFAULT_VALUES.COLORS.BLUE_DARK;
  const nombreBold = config?.bold !== undefined ? config.bold : true;

  doc.setFontSize(nombreFontSize);
  doc.setTextColor(...nombreColor);
  doc.setFont('helvetica', nombreBold ? 'bold' : 'normal');

  if (nombreX === pageWidth / 2) {
    doc.text(nombreCompleto, nombreX, nombreY, { align: 'center' });
  } else {
    doc.text(nombreCompleto, nombreX, nombreY);
  }
}

/**
 * Renderiza el documento de identidad en el PDF
 */
export function renderDocumentId(
  doc: jsPDF,
  pageWidth: number,
  documento: string,
  config: ElementConfig | undefined,
  certificateTypes: CertificateTypeFlags,
): void {
  const { usarConfigAlimentos, usarConfigSustancias } = certificateTypes;

  const docX =
    config?.x !== undefined
      ? config.x
      : usarConfigAlimentos
        ? 405
        : usarConfigSustancias
          ? 370
          : pageWidth / 2;
  const docY =
    config?.y !== undefined
      ? config.y
      : usarConfigAlimentos
        ? 323
        : usarConfigSustancias
          ? 320
          : 323;
  const docFontSize =
    config?.fontSize !== undefined
      ? config.fontSize
      : DEFAULT_VALUES.FONT_SIZES.LARGE;
  const docColor = config?.color ?? DEFAULT_VALUES.COLORS.BLUE_DARK;
  const docBold = config?.bold !== undefined ? config.bold : false;

  doc.setFontSize(docFontSize);
  doc.setTextColor(...docColor);
  doc.setFont('helvetica', docBold ? 'bold' : 'normal');

  const docText = `${documento}`;
  if (docX === pageWidth / 2) {
    doc.text(docText, docX, docY, { align: 'center' });
  } else {
    doc.text(docText, docX, docY);
  }
}

/**
 * Renderiza las firmas en el PDF
 */
export async function renderSignatures(
  doc: jsPDF,
  pageWidth: number,
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
): Promise<void> {
  const { isAlimentos, usarConfigAlimentos, usarConfigSustancias } =
    certificateTypes;

  const instructorSig = getInstructorDetails(isAlimentos);

  // Configuración de firma del instructor
  const instructorFirmaConfig = usarConfigAlimentos
    ? config?.alimentos?.instructorFirma
    : usarConfigSustancias
      ? config?.sustancias?.instructorFirma
      : config?.otros?.instructorFirma;

  await renderInstructorSignature(
    doc,
    pageWidth,
    instructorSig,
    instructorFirmaConfig,
    certificateTypes,
    config,
  );

  await renderRepresentativeSignature(
    doc,
    pageWidth,
    certificateTypes,
    config,
  );
}

async function renderInstructorSignature(
  doc: jsPDF,
  pageWidth: number,
  instructorSig: any,
  firmaConfig: ImageConfig | undefined,
  certificateTypes: CertificateTypeFlags,
  config: PdfConfig | undefined,
): Promise<void> {
  const { isAlimentos, usarConfigAlimentos, usarConfigSustancias } =
    certificateTypes;

  const defaultSigWidth = usarConfigAlimentos
    ? DEFAULT_VALUES.SIGNATURE_DIMENSIONS.ALIMENTOS.width
    : DEFAULT_VALUES.SIGNATURE_DIMENSIONS.OTROS.width;
  const defaultSigHeight = usarConfigAlimentos
    ? DEFAULT_VALUES.SIGNATURE_DIMENSIONS.ALIMENTOS.height
    : DEFAULT_VALUES.SIGNATURE_DIMENSIONS.OTROS.height;
  const defaultSigX = usarConfigAlimentos ? 160 : 156;
  const defaultSigY = DEFAULT_VALUES.POSITIONS.SIGNATURE_Y;

  const instructorFirmaX =
    firmaConfig?.x !== undefined ? firmaConfig.x : defaultSigX;
  const instructorFirmaY =
    firmaConfig?.y !== undefined ? firmaConfig.y : defaultSigY;
  const instructorFirmaWidth =
    firmaConfig?.width !== undefined ? firmaConfig.width : defaultSigWidth;
  const instructorFirmaHeight =
    firmaConfig?.height !== undefined ? firmaConfig.height : defaultSigHeight;

  // Renderizar firma
  if (existsSync(instructorSig.signatureImage)) {
    try {
      const instructorSigImg = await loadImageAsDataUrl(
        instructorSig.signatureImage,
      );
      doc.addImage(
        instructorSigImg,
        'PNG',
        instructorFirmaX,
        instructorFirmaY,
        instructorFirmaWidth,
        instructorFirmaHeight,
      );
    } catch (error) {
      console.warn('No se pudo cargar la firma del instructor:', error);
    }
  }

  // Renderizar nombre del instructor
  const instructorNombreConfig = usarConfigAlimentos
    ? config?.alimentos?.instructorNombre
    : usarConfigSustancias
      ? config?.sustancias?.instructorNombre
      : config?.otros?.instructorNombre;

  renderInstructorName(doc, pageWidth, instructorSig, instructorNombreConfig);
  renderInstructorRole(doc, pageWidth, instructorSig, certificateTypes, config);
}

function renderInstructorName(
  doc: jsPDF,
  pageWidth: number,
  instructorSig: any,
  config: ElementConfig | undefined,
): void {
  const instructorNombreX =
    config?.x !== undefined ? config.x : 160;
  const instructorNombreY =
    config?.y !== undefined
      ? config.y
      : DEFAULT_VALUES.POSITIONS.NAME_Y;
  const instructorNombreFontSize =
    config?.fontSize !== undefined
      ? config.fontSize
      : DEFAULT_VALUES.FONT_SIZES.SMALL;
  const instructorNombreColor =
    config?.color ?? DEFAULT_VALUES.COLORS.BLUE_DARK;
  const instructorNombreBold =
    config?.bold !== undefined ? config.bold : true;

  doc.setFontSize(instructorNombreFontSize);
  doc.setTextColor(...instructorNombreColor);
  doc.setFont('helvetica', instructorNombreBold ? 'bold' : 'normal');
  doc.text(
    instructorSig.name,
    instructorNombreX,
    instructorNombreY,
    instructorNombreX === pageWidth / 2 ? { align: 'center' } : undefined,
  );
}

function renderInstructorRole(
  doc: jsPDF,
  pageWidth: number,
  instructorSig: any,
  certificateTypes: CertificateTypeFlags,
  config: PdfConfig | undefined,
): void {
  const { usarConfigAlimentos, usarConfigSustancias } = certificateTypes;

  const instructorRolConfig = usarConfigAlimentos
    ? config?.alimentos?.instructorRol
    : usarConfigSustancias
      ? config?.sustancias?.instructorRol
      : config?.otros?.instructorRol;

  const instructorRolX =
    instructorRolConfig?.x !== undefined
      ? instructorRolConfig.x
      : usarConfigAlimentos
        ? 217
        : usarConfigSustancias
          ? 160
          : 217;
  const instructorRolY =
    instructorRolConfig?.y !== undefined
      ? instructorRolConfig.y
      : DEFAULT_VALUES.POSITIONS.ROLE_Y;
  const instructorRolFontSize =
    instructorRolConfig?.fontSize !== undefined
      ? instructorRolConfig.fontSize
      : DEFAULT_VALUES.FONT_SIZES.INSTRUCTOR_ROLE;
  const instructorRolColor =
    instructorRolConfig?.color ?? DEFAULT_VALUES.COLORS.BLUE_DARK;
  const instructorRolBold =
    instructorRolConfig?.bold !== undefined ? instructorRolConfig.bold : false;
  const instructorRolLineSpacing =
    instructorRolConfig?.lineSpacing !== undefined
      ? instructorRolConfig.lineSpacing
      : DEFAULT_VALUES.LINE_SPACING.INSTRUCTOR_ROLE;

  doc.setFontSize(instructorRolFontSize);
  doc.setTextColor(...instructorRolColor);
  doc.setFont('helvetica', instructorRolBold ? 'bold' : 'normal');

  const roleLines = instructorSig.role.split('\n');
  roleLines.forEach((line: string, index: number) => {
    const yPos = instructorRolY + index * instructorRolLineSpacing;
    if (instructorRolX === pageWidth / 2) {
      doc.text(line, instructorRolX, yPos, { align: 'center' });
    } else {
      doc.text(line, instructorRolX, yPos);
    }
  });
}

async function renderRepresentativeSignature(
  doc: jsPDF,
  pageWidth: number,
  certificateTypes: CertificateTypeFlags,
  config: PdfConfig | undefined,
): Promise<void> {
  const { isAlimentos, usarConfigAlimentos, usarConfigSustancias } =
    certificateTypes;

  const repSig = getRepresentativeDetails(isAlimentos);

  const representanteFirmaConfig = usarConfigAlimentos
    ? config?.alimentos?.representanteFirma
    : usarConfigSustancias
      ? config?.sustancias?.representanteFirma
      : config?.otros?.representanteFirma;

  const defaultRepSigX = 498.5;
  const defaultRepSigY = usarConfigAlimentos
    ? 455
    : usarConfigSustancias
      ? 440
      : 455;
  const defaultRepSigWidth = DEFAULT_VALUES.SIGNATURE_DIMENSIONS.ALIMENTOS.width;
  const defaultRepSigHeight = DEFAULT_VALUES.SIGNATURE_DIMENSIONS.ALIMENTOS.height;

  const representanteFirmaX =
    representanteFirmaConfig?.x !== undefined
      ? representanteFirmaConfig.x
      : defaultRepSigX;
  const representanteFirmaY =
    representanteFirmaConfig?.y !== undefined
      ? representanteFirmaConfig.y
      : defaultRepSigY;
  const representanteFirmaWidth =
    representanteFirmaConfig?.width !== undefined
      ? representanteFirmaConfig.width
      : defaultRepSigWidth;
  const representanteFirmaHeight =
    representanteFirmaConfig?.height !== undefined
      ? representanteFirmaConfig.height
      : defaultRepSigHeight;

  // Renderizar firma
  if (existsSync(repSig.signatureImage)) {
    try {
      const repSigImg = await loadImageAsDataUrl(repSig.signatureImage);
      doc.addImage(
        repSigImg,
        'PNG',
        representanteFirmaX,
        representanteFirmaY,
        representanteFirmaWidth,
        representanteFirmaHeight,
      );
    } catch (error) {
      console.warn('No se pudo cargar la firma del representante:', error);
    }
  }

  renderRepresentativeName(doc, pageWidth, repSig, certificateTypes, config);
  renderRepresentativeRole(doc, pageWidth, certificateTypes, config);
}

function renderRepresentativeName(
  doc: jsPDF,
  pageWidth: number,
  repSig: any,
  certificateTypes: CertificateTypeFlags,
  config: PdfConfig | undefined,
): void {
  const { usarConfigAlimentos, usarConfigSustancias } = certificateTypes;

  const representanteNombreConfig = usarConfigAlimentos
    ? config?.alimentos?.representanteNombre
    : usarConfigSustancias
      ? config?.sustancias?.representanteNombre
      : config?.otros?.representanteNombre;

  const representanteNombreX =
    representanteNombreConfig?.x !== undefined
      ? representanteNombreConfig.x
      : 490;
  const representanteNombreY =
    representanteNombreConfig?.y !== undefined
      ? representanteNombreConfig.y
      : 506;
  const representanteNombreFontSize =
    representanteNombreConfig?.fontSize !== undefined
      ? representanteNombreConfig.fontSize
      : DEFAULT_VALUES.FONT_SIZES.REPRESENTATIVE_NAME;
  const representanteNombreColor =
    representanteNombreConfig?.color ?? DEFAULT_VALUES.COLORS.BLUE_DARK;
  const representanteNombreBold =
    representanteNombreConfig?.bold !== undefined
      ? representanteNombreConfig.bold
      : true;

  doc.setFontSize(representanteNombreFontSize);
  doc.setTextColor(...representanteNombreColor);
  doc.setFont('helvetica', representanteNombreBold ? 'bold' : 'normal');
  doc.text(
    repSig.name,
    representanteNombreX,
    representanteNombreY,
    representanteNombreX === pageWidth / 2 ? { align: 'center' } : undefined,
  );
}

function renderRepresentativeRole(
  doc: jsPDF,
  pageWidth: number,
  certificateTypes: CertificateTypeFlags,
  config: PdfConfig | undefined,
): void {
  const { usarConfigAlimentos, usarConfigSustancias } = certificateTypes;

  const representanteRolConfig = usarConfigAlimentos
    ? config?.alimentos?.representanteRol
    : usarConfigSustancias
      ? config?.sustancias?.representanteRol
      : config?.otros?.representanteRol;

  const representanteRolX =
    representanteRolConfig?.x !== undefined
      ? representanteRolConfig.x
      : usarConfigAlimentos
        ? 571
        : usarConfigSustancias
          ? 520
          : 571;
  const representanteRolY =
    representanteRolConfig?.y !== undefined
      ? representanteRolConfig.y
      : DEFAULT_VALUES.POSITIONS.ROLE_Y;
  const representanteRolFontSize =
    representanteRolConfig?.fontSize !== undefined
      ? representanteRolConfig.fontSize
      : DEFAULT_VALUES.FONT_SIZES.INSTRUCTOR_ROLE;
  const representanteRolColor =
    representanteRolConfig?.color ?? DEFAULT_VALUES.COLORS.BLUE_DARK;
  const representanteRolBold =
    representanteRolConfig?.bold !== undefined
      ? representanteRolConfig.bold
      : false;

  doc.setFontSize(representanteRolFontSize);
  doc.setTextColor(...representanteRolColor);
  doc.setFont('helvetica', representanteRolBold ? 'bold' : 'normal');

  const representanteRolText = 'Representante Legal';
  if (representanteRolX === pageWidth / 2) {
    doc.text(representanteRolText, representanteRolX, representanteRolY, {
      align: 'center',
    });
  } else {
    doc.text(representanteRolText, representanteRolX, representanteRolY);
  }
}

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
    const urlVerificacion =
      qrGeneratorService.generateVerificationUrlForQR(
        certificado.hashVerificacion,
      );
    const qrImage = await generateQRCodeImage(urlVerificacion, qrGeneratorService);

    if (qrImage) {
      const qrConfig = usarConfigAlimentos
        ? config?.alimentos?.qr
        : usarConfigSustancias
          ? config?.sustancias?.qr
          : config?.otros?.qr;
      const qrSize = qrConfig?.size !== undefined ? qrConfig.size : DEFAULT_VALUES.QR.SIZE;
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
        doc.addImage(qrImageData, 'PNG', qrX, qrY, qrSize, qrSize);
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
  const { isAlimentos, isCesaroto, usarConfigAlimentos, usarConfigSustancias } =
    certificateTypes;

  const footerConfig = usarConfigAlimentos
    ? config?.alimentos?.footer
    : usarConfigSustancias
      ? config?.sustancias?.footer
      : config?.otros?.footer;

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

  const allianceCompany = getAllianceCompany(isAlimentos, isCesaroto);

  // Construir el texto completo para calcular el ancho y dividir en líneas
  const footerText = `Certificado emitido por FORMAR360 en alianza con ${allianceCompany} La autenticidad de este documento puede verificarse escaneando el código QR.`;
  const footerLines = doc.splitTextToSize(footerText, pageWidth - 40);

  // Función helper para renderizar una línea con formato mixto
  const renderMixedLine = (
    line: string,
    yPos: number,
    isCentered: boolean,
  ) => {
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