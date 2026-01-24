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