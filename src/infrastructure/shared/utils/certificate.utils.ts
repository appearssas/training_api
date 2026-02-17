import { join } from 'path';
import { PUBLIC_ASSETS_PATH } from '../constants/pdf.constants';
import {
  InstructorDetails,
  RepresentativeDetails,
  CertificateTypeFlags,
  DynamicDataConfig,
} from '../types/pdf-config.interface';

export type TipoCertificadoCapacitacion = 'alimentos' | 'sustancias' | 'otros';

/** Capacitación con campos usados para certificado (maestra de cursos). */
export interface CapacitacionCertificado {
  tipoCertificado?: TipoCertificadoCapacitacion | null;
  titulo?: string | null;
  duracionHoras?: number | null;
}

/** Capacitación con ente certificador (maestra) para texto de alianza en certificado. */
export interface CapacitacionConEnte {
  enteCertificador?: { nombre: string } | null;
}

/**
 * Determina el fondo del certificado desde la maestra de cursos (tipoCertificado).
 * Solo usa base de datos; si no está definido, se usa 'otros'.
 */
export function getCertificateBackground(
  capacitacion: CapacitacionCertificado | null | undefined,
): string {
  const tipo = getTipoCertificadoFromCapacitacion(capacitacion);
  if (tipo === 'alimentos') {
    return join(PUBLIC_ASSETS_PATH, 'fondoAlimentos.png');
  }
  if (tipo === 'sustancias') {
    return join(PUBLIC_ASSETS_PATH, 'fondoSustanciasP.png');
  }
  return join(PUBLIC_ASSETS_PATH, 'fondoGeneral.png');
}

/**
 * Obtiene el tipo de certificado desde la maestra de cursos (solo base de datos).
 * Si no está definido en la capacitación, devuelve 'otros'.
 */
function getTipoCertificadoFromCapacitacion(
  capacitacion: CapacitacionCertificado | null | undefined,
): TipoCertificadoCapacitacion {
  const tipo = capacitacion?.tipoCertificado;
  if (tipo === 'alimentos' || tipo === 'sustancias' || tipo === 'otros') {
    return tipo;
  }
  return 'otros';
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
 * Obtiene los detalles del representante legal desde la maestra (tabla representantes)
 * o desde la configuración dinámica del certificado.
 * @param representativeOverride - Datos del representante desde BD (ente certificador → representantes)
 * @param dynamicData - Datos dinámicos opcionales (override desde formato de certificado)
 */
export function getRepresentativeDetails(
  representativeOverride?: RepresentativeDetails | null,
  dynamicData?: DynamicDataConfig,
): RepresentativeDetails {
  const fromDb =
    representativeOverride &&
    (representativeOverride.name || representativeOverride.signatureImage)
      ? representativeOverride
      : null;

  if (dynamicData?.representante) {
    const { nombre, firmaImagen } = dynamicData.representante;

    return {
      name: nombre ?? fromDb?.name ?? '',
      signatureImage:
        firmaImagen != null && firmaImagen !== ''
          ? join(PUBLIC_ASSETS_PATH, firmaImagen)
          : (fromDb?.signatureImage ?? ''),
      role: fromDb?.role ?? '',
    };
  }

  if (fromDb) {
    return fromDb;
  }

  return { name: '', signatureImage: '', role: '' };
}

/**
 * Obtiene la compañía aliada desde la maestra (ente certificador de la capacitación)
 * o desde la configuración dinámica del certificado.
 * @param capacitacion - Capacitación con enteCertificador (maestra)
 * @param dynamicData - Datos dinámicos opcionales (override desde formato de certificado)
 */
export function getAllianceCompany(
  capacitacion: CapacitacionConEnte | null | undefined,
  dynamicData?: DynamicDataConfig,
): string {
  if (dynamicData?.alianzaEmpresa) {
    return dynamicData.alianzaEmpresa;
  }
  const nombre = capacitacion?.enteCertificador?.nombre?.trim();
  return nombre ?? '';
}

/**
 * Obtiene la duración en horas desde la maestra de cursos (solo base de datos: capacitacion.duracionHoras).
 * Si no está definida, devuelve "20" para no romper la generación del certificado.
 */
export function getDuration(
  capacitacion: CapacitacionCertificado | null | undefined,
): string {
  if (!capacitacion) return '20';
  const horas = capacitacion.duracionHoras;
  if (horas != null && !Number.isNaN(Number(horas))) {
    return String(Math.round(Number(horas)));
  }
  return '20';
}

/**
 * Determina los tipos de certificado desde la maestra de cursos (solo base de datos: tipoCertificado).
 */
export function determineCertificateTypes(
  capacitacion: CapacitacionCertificado | null | undefined,
): CertificateTypeFlags {
  const tipo = getTipoCertificadoFromCapacitacion(capacitacion);
  const isAlimentos = tipo === 'alimentos';
  const isSustanciasPeligrosas = tipo === 'sustancias';
  const isCesaroto = isSustanciasPeligrosas;

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
