import { join } from 'path';
import { PUBLIC_ASSETS_PATH } from '../constants/pdf.constants';
import {
  InstructorDetails,
  RepresentativeDetails,
  CertificateTypeFlags,
} from '../types/pdf-config.interface';

/**
 * Determina el fondo del certificado basado en el título
 */
export function getCertificateBackground(capacitacion: any): string {
  let backgroundName = 'fondoGeneral_2.svg'; // Default

  if (capacitacion?.titulo) {
    const titulo = capacitacion.titulo.toLowerCase();

    // Logic: Alimentos -> Fondo Alimentos
    if (
      (titulo.includes('manipulación') && titulo.includes('alimentos')) ||
      (titulo.includes('manipulacion') && titulo.includes('alimentos')) ||
      (titulo.includes('primeros') && titulo.includes('auxilios'))
    ) {
      backgroundName = 'fondoAlimentos_2.svg';
    }
    // Logic: Sustancias / Mercancías Peligrosas -> Fondo Sustancias
    else if (
      titulo.includes('transporte') &&
      (titulo.includes('mercancias') || titulo.includes('mercancías')) &&
      titulo.includes('peligrosas')
    ) {
      backgroundName = 'fondoSustanciasP_2.svg';
    }
  }

  return join(PUBLIC_ASSETS_PATH, backgroundName);
}

/**
 * Obtiene los detalles del instructor basado en el tipo de curso
 */
export function getInstructorDetails(isAlimentos: boolean): InstructorDetails {
  if (isAlimentos) {
    return {
      name: 'Nini Johana Peña Vanegaz',
      role: 'Instructor / Entrenador\nTSA REG xxxxxxxxx\nLicencia SST',
      signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_nini_pena.png'),
    };
  }
  return {
    name: 'Viviana Paola Rojas Hincapie',
    role: 'Instructor / Entrenador\nTSA REG xxxxxxxxx\nLicencia SST',
    signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_viviana_rojas.png'),
  };
}

/**
 * Obtiene los detalles del representante legal basado en el tipo de curso
 */
export function getRepresentativeDetails(
  isAlimentos: boolean,
): RepresentativeDetails {
  if (isAlimentos) {
    return {
      name: 'Francy Dayany Gonzalez Galindo',
      signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_francy_gonzalez.png'),
    };
  }
  return {
    name: 'Alfonso Alejandro Velasco Reyes',
    signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_alfonso_velasco.png'),
  };
}

/**
 * Obtiene la compañía aliada basada en el tipo de curso
 */
export function getAllianceCompany(
  isAlimentos: boolean,
  isCesaroto: boolean,
): string {
  if (isAlimentos) {
    return 'IPS CONFIANZA.';
  }
  if (isCesaroto) {
    return 'CEASAROTO.';
  }
  return 'ANDAR DEL LLANO.';
}

/**
 * Obtiene la duración del curso basada en el tipo
 */
export function getDuration(isCesaroto: boolean, isAlimentos: boolean): string {
  if (isCesaroto) {
    return '60';
  }
  if (isAlimentos) {
    return '10';
  }
  return '20';
}

/**
 * Determina los tipos de certificado y configuraciones a usar
 */
export function determineCertificateTypes(
  capacitacion: any,
): CertificateTypeFlags {
  const tituloLower = (capacitacion?.titulo || '').toLowerCase().trim();

  const isAlimentos =
    (tituloLower.includes('alimentos') &&
      (tituloLower.includes('manipulación') ||
        tituloLower.includes('manipulacion'))) ||
    (tituloLower.includes('primeros') && tituloLower.includes('auxilios'));

  const isCesaroto =
    tituloLower.includes('transporte') &&
    (tituloLower.includes('mercancias') ||
      tituloLower.includes('mercancías')) &&
    tituloLower.includes('peligrosas');

  const isSustanciasPeligrosas =
    tituloLower.includes('peligrosas') ||
    (tituloLower.includes('sustancias') &&
      tituloLower.includes('peligrosas')) ||
    (tituloLower.includes('mercancías') &&
      tituloLower.includes('peligrosas')) ||
    (tituloLower.includes('mercancias') &&
      tituloLower.includes('peligrosas'));

  return {
    isAlimentos,
    isCesaroto,
    isSustanciasPeligrosas,
    usarConfigAlimentos: isAlimentos,
    usarConfigSustancias: isSustanciasPeligrosas,
  };
}

/**
 * Formatea las fechas para mostrar en el certificado
 */
export function formatCertificateDates(
  fechaEmision: Date | null,
  fechaVencimiento: Date | null,
) {
  const localeDateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  };

  const fechaEmisionFormatted = fechaEmision
    ? new Date(fechaEmision).toLocaleDateString('es-ES', localeDateOptions)
    : '';
  const fechaVencimientoFormatted = fechaVencimiento
    ? new Date(fechaVencimiento).toLocaleDateString('es-ES', localeDateOptions)
    : '';

  return {
    fechaEmision: fechaEmisionFormatted,
    fechaVencimiento: fechaVencimientoFormatted,
  };
}