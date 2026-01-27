import { jsPDF } from 'jspdf';
import { existsSync } from 'fs';
import { PdfConfig, CertificateTypeFlags } from '../types/pdf-config.interface';
import { DEFAULT_VALUES } from '../constants/pdf.constants';
import { loadImageAsDataUrl } from './image.utils';
import {
  getInstructorDetails,
  getRepresentativeDetails,
} from './certificate.utils';
import { getCertificateConfig, getImageConfig } from './config-helpers.utils';
import { renderPersonName, renderRole } from './text-renderer.utils';

/**
 * Renderiza la imagen de una firma en el PDF
 */
async function renderSignatureImage(
  doc: jsPDF,
  signaturePath: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<void> {
  if (!existsSync(signaturePath)) {
    return;
  }

  try {
    const signatureImg = await loadImageAsDataUrl(signaturePath);
    doc.addImage(signatureImg, 'PNG', x, y, width, height);
  } catch (error) {
    console.warn(`No se pudo cargar la firma en ${signaturePath}:`, error);
  }
}

/**
 * Obtiene las dimensiones por defecto de la firma según el tipo de certificado
 */
function getDefaultSignatureDimensions(
  certificateTypes: CertificateTypeFlags,
): { width: number; height: number } {
  const { usarConfigAlimentos } = certificateTypes;

  return usarConfigAlimentos
    ? DEFAULT_VALUES.SIGNATURE_DIMENSIONS.ALIMENTOS
    : DEFAULT_VALUES.SIGNATURE_DIMENSIONS.OTROS;
}

/**
 * Renderiza la firma del instructor
 */
export async function renderInstructorSignature(
  doc: jsPDF,
  pageWidth: number,
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
): Promise<void> {
  const { isAlimentos, usarConfigAlimentos, usarConfigSustancias } =
    certificateTypes;

  const instructorSig = getInstructorDetails(isAlimentos);
  const firmaConfig = getImageConfig(
    config,
    certificateTypes,
    'instructorFirma',
  );

  const defaultDimensions = getDefaultSignatureDimensions(certificateTypes);
  const defaultSigX = usarConfigAlimentos ? 160 : 156;
  const defaultSigY = DEFAULT_VALUES.POSITIONS.SIGNATURE_Y;

  const instructorFirmaX =
    firmaConfig?.x !== undefined ? firmaConfig.x : defaultSigX;
  const instructorFirmaY =
    firmaConfig?.y !== undefined ? firmaConfig.y : defaultSigY;
  const instructorFirmaWidth =
    firmaConfig?.width !== undefined
      ? firmaConfig.width
      : defaultDimensions.width;
  const instructorFirmaHeight =
    firmaConfig?.height !== undefined
      ? firmaConfig.height
      : defaultDimensions.height;

  // Renderizar imagen de firma
  await renderSignatureImage(
    doc,
    instructorSig.signatureImage,
    instructorFirmaX,
    instructorFirmaY,
    instructorFirmaWidth,
    instructorFirmaHeight,
  );

  // Renderizar nombre del instructor
  const instructorNombreConfig = getCertificateConfig(
    config,
    certificateTypes,
  )?.instructorNombre;

  renderPersonName(
    doc,
    pageWidth,
    instructorSig.name,
    instructorNombreConfig,
    160,
    DEFAULT_VALUES.POSITIONS.NAME_Y,
    DEFAULT_VALUES.FONT_SIZES.SMALL,
  );

  // Renderizar rol del instructor
  const instructorRolConfig = getCertificateConfig(
    config,
    certificateTypes,
  )?.instructorRol;

  const instructorRolX =
    instructorRolConfig?.x !== undefined
      ? instructorRolConfig.x
      : usarConfigAlimentos
        ? 217
        : usarConfigSustancias
          ? 160
          : 217;

  renderRole(
    doc,
    pageWidth,
    instructorSig.role,
    instructorRolConfig,
    instructorRolX,
    DEFAULT_VALUES.POSITIONS.ROLE_Y,
    DEFAULT_VALUES.FONT_SIZES.INSTRUCTOR_ROLE,
  );
}

/**
 * Renderiza la firma del representante legal
 */
export async function renderRepresentativeSignature(
  doc: jsPDF,
  pageWidth: number,
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
): Promise<void> {
  const { isAlimentos, usarConfigAlimentos, usarConfigSustancias } =
    certificateTypes;

  const repSig = getRepresentativeDetails(isAlimentos);
  const representanteFirmaConfig = getImageConfig(
    config,
    certificateTypes,
    'representanteFirma',
  );

  const defaultRepSigX = 498.5;
  const defaultRepSigY = usarConfigAlimentos
    ? 455
    : usarConfigSustancias
      ? 440
      : 455;
  const defaultDimensions = DEFAULT_VALUES.SIGNATURE_DIMENSIONS.ALIMENTOS;

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
      : defaultDimensions.width;
  const representanteFirmaHeight =
    representanteFirmaConfig?.height !== undefined
      ? representanteFirmaConfig.height
      : defaultDimensions.height;

  // Renderizar imagen de firma
  await renderSignatureImage(
    doc,
    repSig.signatureImage,
    representanteFirmaX,
    representanteFirmaY,
    representanteFirmaWidth,
    representanteFirmaHeight,
  );

  // Renderizar nombre del representante
  const representanteNombreConfig = getCertificateConfig(
    config,
    certificateTypes,
  )?.representanteNombre;

  renderPersonName(
    doc,
    pageWidth,
    repSig.name,
    representanteNombreConfig,
    490,
    506,
    DEFAULT_VALUES.FONT_SIZES.REPRESENTATIVE_NAME,
  );

  // Renderizar rol del representante
  const representanteRolConfig = getCertificateConfig(
    config,
    certificateTypes,
  )?.representanteRol;

  const representanteRolX =
    representanteRolConfig?.x !== undefined
      ? representanteRolConfig.x
      : usarConfigAlimentos
        ? 571
        : usarConfigSustancias
          ? 520
          : 571;

  renderRole(
    doc,
    pageWidth,
    'Representante Legal',
    representanteRolConfig,
    representanteRolX,
    DEFAULT_VALUES.POSITIONS.ROLE_Y,
    DEFAULT_VALUES.FONT_SIZES.INSTRUCTOR_ROLE,
  );
}

/**
 * Renderiza todas las firmas (instructor y representante) en el PDF
 */
export async function renderSignatures(
  doc: jsPDF,
  pageWidth: number,
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
): Promise<void> {
  await renderInstructorSignature(doc, pageWidth, config, certificateTypes);
  await renderRepresentativeSignature(doc, pageWidth, config, certificateTypes);
}
