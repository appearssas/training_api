/**
 * Interfaz para configuración de posiciones y estilos del PDF (editable en tiempo real)
 */
export interface PdfConfig {
  // Alimentos
  alimentos?: CertificateConfig;
  // Sustancias peligrosas
  sustancias?: CertificateConfig;
  // Otros certificados
  otros?: CertificateConfigOtros;
}

export interface ElementConfig {
  x?: number;
  y?: number;
  fontSize?: number;
  color?: [number, number, number];
  bold?: boolean;
}

export interface ElementConfigWithLineSpacing extends ElementConfig {
  lineSpacing?: number;
}

export interface ImageConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface QrConfig {
  x?: number;
  y?: number;
  size?: number;
}

/**
 * Configuración de datos dinámicos para instructor
 */
export interface InstructorDynamicConfig {
  nombre?: string; // Texto del nombre del instructor
  rol?: string; // Texto del rol (puede incluir \n para multilínea)
  firmaImagen?: string; // Nombre del archivo de firma (ej: 'firma_nini_pena.png')
}

/**
 * Configuración de datos dinámicos para representante legal
 */
export interface RepresentanteDynamicConfig {
  nombre?: string; // Texto del nombre del representante
  firmaImagen?: string; // Nombre del archivo de firma (ej: 'firma_alfonso_velasco.png')
}

/**
 * Configuración de datos dinámicos generales del certificado
 */
export interface DynamicDataConfig {
  duracionHoras?: string; // Duración del curso en horas (ej: '10', '20', '60')
  alianzaEmpresa?: string; // Nombre de la empresa aliada (ej: 'IPS CONFIANZA.', 'CEASAROTO.')
  instructor?: InstructorDynamicConfig;
  representante?: RepresentanteDynamicConfig;
}

export interface CertificateConfig {
  cursoNombre?: ElementConfig;
  nombreEstudiante?: ElementConfig;
  documento?: ElementConfig;
  duracion?: ElementConfig;
  fechaEmision?: ElementConfig;
  fechaVencimiento?: ElementConfig;
  instructorNombre?: ElementConfig;
  instructorRol?: ElementConfigWithLineSpacing;
  instructorFirma?: ImageConfig;
  representanteNombre?: ElementConfig;
  representanteRol?: ElementConfig;
  representanteFirma?: ImageConfig;
  qr?: QrConfig;
  footer?: ElementConfig;
  // Datos dinámicos (textos editables)
  dataDinamica?: DynamicDataConfig;
}

export interface CertificateConfigOtros extends CertificateConfig {
  titulo?: ElementConfig;
  certificaQue?: ElementConfig;
}

export interface InstructorDetails {
  name: string;
  role: string;
  signatureImage: string;
}

export interface RepresentativeDetails {
  name: string;
  signatureImage: string;
}

export interface CertificateTypeFlags {
  isAlimentos: boolean;
  isCesaroto: boolean;
  isSustanciasPeligrosas: boolean;
  usarConfigAlimentos: boolean;
  usarConfigSustancias: boolean;
}

export interface CertificateData {
  nombreCompleto: string;
  documento: string;
  cursoNombre: string;
  fechaEmision: string;
  fechaVencimiento: string;
  duration: string;
}