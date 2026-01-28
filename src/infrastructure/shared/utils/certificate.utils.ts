import { join } from 'path';
import { PUBLIC_ASSETS_PATH } from '../constants/pdf.constants';
import {
  InstructorDetails,
  RepresentativeDetails,
  CertificateTypeFlags,
  DynamicDataConfig,
} from '../types/pdf-config.interface';

/**
 * Determina el fondo del certificado basado en el título
 */
export function getCertificateBackground(capacitacion: any): string {
  let backgroundName = 'fondoGeneral.png'; // Default

  if (capacitacion?.titulo) {
    const titulo = capacitacion.titulo.toLowerCase();

    // Logic: Alimentos -> Fondo Alimentos
    if (
      (titulo.includes('manipulación') && titulo.includes('alimentos')) ||
      (titulo.includes('manipulacion') && titulo.includes('alimentos')) ||
      (titulo.includes('primeros') && titulo.includes('auxilios'))
    ) {
      backgroundName = 'fondoAlimentos.png';
    }
    // Logic: Sustancias / Mercancías Peligrosas -> Fondo Sustancias
    else if (
      titulo.includes('transporte') &&
      (titulo.includes('mercancias') || titulo.includes('mercancías')) &&
      titulo.includes('peligrosas')
    ) {
      backgroundName = 'fondoSustanciasP.png';
    }
  }

  return join(PUBLIC_ASSETS_PATH, backgroundName);
}

/**
 * Valores por defecto del instructor para alimentos
 */
const DEFAULT_INSTRUCTOR_ALIMENTOS: InstructorDetails = {
  name: 'Nini Johana Peña Vanegaz',
  role: 'Instructor / Entrenador\nTSA RM 30937322\nLicencia SST',
  signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_nini_pena.png'),
};

/**
 * Valores por defecto del instructor para otros cursos
 */
const DEFAULT_INSTRUCTOR_OTROS: InstructorDetails = {
  name: 'Viviana Paola Rojas Hincapie',
  role: 'Instructor / Entrenador\nTSA REG 48207\nLicencia SST',
  signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_viviana_rojas.png'),
};

/**
 * Obtiene los detalles del instructor basado en el tipo de curso y configuración dinámica
 * @param isAlimentos - Indica si es un curso de alimentos
 * @param dynamicData - Datos dinámicos opcionales de la base de datos
 */
export function getInstructorDetails(
  isAlimentos: boolean,
  dynamicData?: DynamicDataConfig,
): InstructorDetails {
  // Obtener valores por defecto según el tipo de curso
  const defaults = isAlimentos
    ? DEFAULT_INSTRUCTOR_ALIMENTOS
    : DEFAULT_INSTRUCTOR_OTROS;

  // Si hay datos dinámicos del instructor, usarlos; si no, usar defaults
  if (dynamicData?.instructor) {
    const { nombre, rol, firmaImagen } = dynamicData.instructor;
    return {
      name: nombre || defaults.name,
      role: rol || defaults.role,
      signatureImage: firmaImagen
        ? join(PUBLIC_ASSETS_PATH, firmaImagen)
        : defaults.signatureImage,
    };
  }

  return defaults;
}

/**
 * Valores por defecto del representante para alimentos
 */
const DEFAULT_REPRESENTANTE_ALIMENTOS: RepresentativeDetails = {
  name: 'Francy Dayany Gonzalez Galindo',
  signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_francy_gonzalez.png'),
};

/**
 * Valores por defecto del representante para otros cursos
 */
const DEFAULT_REPRESENTANTE_OTROS: RepresentativeDetails = {
  name: 'Alfonso Alejandro Velasco Reyes',
  signatureImage: join(PUBLIC_ASSETS_PATH, 'firma_alfonso_velasco.png'),
};

/**
 * Obtiene los detalles del representante legal basado en el tipo de curso y configuración dinámica
 * @param isAlimentos - Indica si es un curso de alimentos
 * @param dynamicData - Datos dinámicos opcionales de la base de datos
 */
export function getRepresentativeDetails(
  isAlimentos: boolean,
  dynamicData?: DynamicDataConfig,
): RepresentativeDetails {
  // Obtener valores por defecto según el tipo de curso
  const defaults = isAlimentos
    ? DEFAULT_REPRESENTANTE_ALIMENTOS
    : DEFAULT_REPRESENTANTE_OTROS;

  // Si hay datos dinámicos del representante, usarlos; si no, usar defaults
  if (dynamicData?.representante) {
    const { nombre, firmaImagen } = dynamicData.representante;
    return {
      name: nombre || defaults.name,
      signatureImage: firmaImagen
        ? join(PUBLIC_ASSETS_PATH, firmaImagen)
        : defaults.signatureImage,
    };
  }

  return defaults;
}

/**
 * Obtiene la compañía aliada basada en el tipo de curso y configuración dinámica
 * @param isAlimentos - Indica si es un curso de alimentos
 * @param isCesaroto - Indica si es un curso de Cesaroto
 * @param dynamicData - Datos dinámicos opcionales de la base de datos
 */
export function getAllianceCompany(
  isAlimentos: boolean,
  isCesaroto: boolean,
  dynamicData?: DynamicDataConfig,
): string {
  // Si hay datos dinámicos de la empresa aliada, usarlos
  if (dynamicData?.alianzaEmpresa) {
    return dynamicData.alianzaEmpresa;
  }

  // Valores por defecto según el tipo de curso
  if (isAlimentos) {
    return 'IPS CONFIANZA.';
  }
  if (isCesaroto) {
    return 'CEASAROTO.';
  }
  return 'ANDAR DEL LLANO.';
}

/**
 * Obtiene la duración del curso basada en el tipo y configuración dinámica
 * @param isCesaroto - Indica si es un curso de Cesaroto
 * @param isAlimentos - Indica si es un curso de alimentos
 * @param dynamicData - Datos dinámicos opcionales de la base de datos
 */
export function getDuration(
  isCesaroto: boolean,
  isAlimentos: boolean,
  dynamicData?: DynamicDataConfig,
): string {
  // Si hay datos dinámicos de duración, usarlos
  if (dynamicData?.duracionHoras) {
    return dynamicData.duracionHoras;
  }

  // Valores por defecto según el tipo de curso
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
    (tituloLower.includes('mercancias') && tituloLower.includes('peligrosas'));

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
): { fechaEmision: string; fechaVencimiento: string } {
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
