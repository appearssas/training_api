import {
  PdfConfig,
  ElementConfig,
  ElementConfigWithLineSpacing,
  ImageConfig,
  QrConfig,
  CertificateConfig,
  CertificateConfigOtros,
  CertificateTypeFlags,
} from '../types/pdf-config.interface';

/** Convierte a número si el valor es un número o string numérico; evita NaN. */
function toNumber(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

/** Normaliza campos numéricos de ImageConfig (p. ej. cuando vienen como string del JSON). */
function normalizeImageConfig(
  c: ImageConfig | undefined,
): ImageConfig | undefined {
  if (!c || typeof c !== 'object') return c;
  const x = toNumber(c.x);
  const y = toNumber(c.y);
  const width = toNumber(c.width);
  const height = toNumber(c.height);
  if (
    x === undefined &&
    y === undefined &&
    width === undefined &&
    height === undefined
  ) {
    return c;
  }
  return { ...c, ...(x !== undefined && { x }), ...(y !== undefined && { y }), ...(width !== undefined && { width }), ...(height !== undefined && { height }) };
}

/** Normaliza campos numéricos de ElementConfig (y opcionalmente lineSpacing). */
function normalizeElementConfig(
  c: ElementConfig | ElementConfigWithLineSpacing | undefined,
  opts?: { withLineSpacing?: boolean },
): ElementConfig | ElementConfigWithLineSpacing | undefined {
  if (!c || typeof c !== 'object') return c;
  const x = toNumber(c.x);
  const y = toNumber(c.y);
  const fontSize = toNumber(c.fontSize);
  const lineSpacing =
    opts?.withLineSpacing && 'lineSpacing' in c
      ? toNumber((c as ElementConfigWithLineSpacing).lineSpacing)
      : undefined;
  let color = c.color;
  if (Array.isArray(c.color) && c.color.length >= 3) {
    const r = toNumber(c.color[0]);
    const g = toNumber(c.color[1]);
    const b = toNumber(c.color[2]);
    if (r !== undefined && g !== undefined && b !== undefined) {
      color = [r, g, b];
    }
  }
  const out: Record<string, unknown> = { ...c };
  if (x !== undefined) out.x = x;
  if (y !== undefined) out.y = y;
  if (fontSize !== undefined) out.fontSize = fontSize;
  if (lineSpacing !== undefined) out.lineSpacing = lineSpacing;
  if (color !== undefined) out.color = color;
  return out as ElementConfig | ElementConfigWithLineSpacing;
}

/** Normaliza campos numéricos de QrConfig. */
function normalizeQrConfig(c: QrConfig | undefined): QrConfig | undefined {
  if (!c || typeof c !== 'object') return c;
  const x = toNumber(c.x);
  const y = toNumber(c.y);
  const size = toNumber(c.size);
  if (x === undefined && y === undefined && size === undefined) return c;
  return { ...c, ...(x !== undefined && { x }), ...(y !== undefined && { y }), ...(size !== undefined && { size }) };
}

/**
 * Obtiene la configuración del tipo de certificado según los flags
 */
export function getCertificateConfig(
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
): CertificateConfig | undefined {
  const { usarConfigAlimentos, usarConfigSustancias } = certificateTypes;

  if (usarConfigAlimentos) {
    return config?.alimentos;
  }
  if (usarConfigSustancias) {
    return config?.sustancias;
  }
  return config?.otros;
}

/**
 * Obtiene la configuración de un elemento específico según el tipo de certificado
 */
export function getElementConfig(
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
  elementKey: keyof CertificateConfig,
): ElementConfig | undefined {
  const certificateConfig = getCertificateConfig(config, certificateTypes);
  return certificateConfig?.[elementKey] as ElementConfig | undefined;
}

/**
 * Obtiene la configuración de una imagen según el tipo de certificado
 */
export function getImageConfig(
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
  imageKey: 'instructorFirma' | 'representanteFirma',
): ImageConfig | undefined {
  const certificateConfig = getCertificateConfig(config, certificateTypes);
  return certificateConfig?.[imageKey] as ImageConfig;
}

/**
 * Obtiene un valor de configuración con un valor por defecto
 */
export function getConfigValue<T>(
  configValue: T | undefined,
  defaultValue: T,
): T {
  return configValue !== undefined ? configValue : defaultValue;
}

/**
 * Obtiene un valor de configuración condicional basado en el tipo de certificado
 */
export function getConditionalConfigValue<T>(
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
  elementKey: keyof CertificateConfig,
  propertyKey: keyof ElementConfig,
  defaultValue: T,
  conditionalDefaults?: {
    alimentos?: T;
    sustancias?: T;
    otros?: T;
  },
): T {
  const elementConfig = getElementConfig(config, certificateTypes, elementKey);
  const configValue = elementConfig?.[propertyKey] as T | undefined;

  if (configValue !== undefined) {
    return configValue;
  }

  if (conditionalDefaults) {
    const { usarConfigAlimentos, usarConfigSustancias } = certificateTypes;
    if (usarConfigAlimentos && conditionalDefaults.alimentos !== undefined) {
      return conditionalDefaults.alimentos;
    }
    if (usarConfigSustancias && conditionalDefaults.sustancias !== undefined) {
      return conditionalDefaults.sustancias;
    }
    if (conditionalDefaults.otros !== undefined) {
      return conditionalDefaults.otros;
    }
  }

  return defaultValue;
}

/**
 * Obtiene la configuración con valores por defecto para la categoría "otros"
 * NOTA: Estos valores ahora se obtienen desde la base de datos.
 * Esta función solo se usa como fallback si no hay configuración en BD.
 */
export function getDefaultOtrosConfig(): CertificateConfigOtros {
  return {
    cursoNombre: {
      x: 396,
      y: 395,
      fontSize: 18,
      bold: true,
      color: [255, 255, 255],
    },
    nombreEstudiante: {
      x: 396,
      y: 290,
      fontSize: 18,
      bold: true,
      color: [41, 37, 97],
    },
    documento: {
      x: 450,
      y: 320,
      fontSize: 18,
      bold: false,
    },
    duracion: {
      x: 445,
      y: 422,
      fontSize: 14,
      bold: false,
    },
    fechaEmision: {
      x: 250,
      y: 437,
      fontSize: 14,
      bold: false,
    },
    fechaVencimiento: {
      x: 520,
      y: 438,
      fontSize: 14,
      bold: false,
    },
    qr: {
      x: 689,
      y: 449,
      size: 70,
    },
    instructorFirma: {
      x: 130,
      y: 450,
      width: 190,
      height: 80,
    },
    instructorNombre: {
      x: 150,
      y: 505,
      fontSize: 10,
      bold: true,
      color: [41, 37, 97],
    },
    instructorRol: {
      x: 150,
      y: 513,
      fontSize: 9.5,
      bold: false,
      lineSpacing: 12,
      color: [41, 37, 97],
    },
    representanteFirma: {
      x: 495,
      y: 445,
      width: 145,
      height: 61,
    },
    representanteNombre: {
      x: 485,
      y: 505,
      fontSize: 9.9,
      bold: true,
      color: [41, 37, 97],
    },
    representanteRol: {
      x: 515,
      y: 513,
      fontSize: 9.5,
      bold: false,
      color: [41, 37, 97],
    },
    footer: {
      x: 396,
      y: 590,
      fontSize: 7,
      bold: true,
      color: [41, 37, 97],
    },
  };
}

/**
 * Fusiona config de rol (instructor/representante) con defaults.
 * Asegura que nunca se pierdan fontSize, x, y válidos al editar solo posición en el frontend.
 */
function mergeRoleConfig<T extends ElementConfig | undefined>(
  defaultConfig: T,
  fromRequest: T | undefined,
): T {
  const merged = {
    ...defaultConfig,
    ...(fromRequest && typeof fromRequest === 'object' ? fromRequest : {}),
  } as T & { fontSize?: number };
  if (merged && (merged.fontSize === undefined || merged.fontSize === 0)) {
    merged.fontSize = (defaultConfig as ElementConfig)?.fontSize ?? 9.5;
  }
  return merged as T;
}

/**
 * Obtiene la configuración con valores por defecto aplicados para la categoría "otros"
 * Si config.otros existe, se fusiona con los valores por defecto
 */
export function getConfigWithDefaults(
  config: PdfConfig | undefined,
  certificateTypes: CertificateTypeFlags,
): PdfConfig {
  const { usarConfigAlimentos, usarConfigSustancias } = certificateTypes;

  // Si no es categoría "otros", retornar config tal cual
  if (usarConfigAlimentos || usarConfigSustancias) {
    return config || {};
  }

  // Para categoría "otros", aplicar valores por defecto
  const defaultOtros = getDefaultOtrosConfig();

  if (!config) {
    return { otros: defaultOtros };
  }

  // Fusionar config.otros con valores por defecto
  if (!config.otros) {
    return { ...config, otros: defaultOtros };
  }

  // Fusionar cada propiedad de config.otros con los valores por defecto y normalizar números
  // (el JSON puede llegar con x, y, width, height, fontSize, etc. como string)
  const mergedOtros: CertificateConfigOtros = {
    ...defaultOtros,
    ...config.otros,
    cursoNombre: normalizeElementConfig({
      ...defaultOtros.cursoNombre,
      ...config.otros.cursoNombre,
    }) as ElementConfig,
    nombreEstudiante: normalizeElementConfig({
      ...defaultOtros.nombreEstudiante,
      ...config.otros.nombreEstudiante,
    }) as ElementConfig,
    documento: normalizeElementConfig({
      ...defaultOtros.documento,
      ...config.otros.documento,
    }) as ElementConfig,
    duracion: normalizeElementConfig({
      ...defaultOtros.duracion,
      ...config.otros.duracion,
    }) as ElementConfig,
    fechaEmision: normalizeElementConfig({
      ...defaultOtros.fechaEmision,
      ...config.otros.fechaEmision,
    }) as ElementConfig,
    fechaVencimiento: normalizeElementConfig({
      ...defaultOtros.fechaVencimiento,
      ...config.otros.fechaVencimiento,
    }) as ElementConfig,
    qr: normalizeQrConfig({
      ...defaultOtros.qr,
      ...config.otros.qr,
    }),
    instructorFirma: normalizeImageConfig({
      ...defaultOtros.instructorFirma,
      ...config.otros.instructorFirma,
    }),
    instructorNombre: normalizeElementConfig({
      ...defaultOtros.instructorNombre,
      ...config.otros.instructorNombre,
    }) as ElementConfig,
    instructorRol: normalizeElementConfig(
      mergeRoleConfig(
        defaultOtros.instructorRol,
        config.otros.instructorRol,
      ) as ElementConfigWithLineSpacing,
      { withLineSpacing: true },
    ) as ElementConfigWithLineSpacing,
    representanteFirma: normalizeImageConfig({
      ...defaultOtros.representanteFirma,
      ...config.otros.representanteFirma,
    }),
    representanteNombre: normalizeElementConfig({
      ...defaultOtros.representanteNombre,
      ...config.otros.representanteNombre,
    }) as ElementConfig,
    representanteRol: normalizeElementConfig(
      mergeRoleConfig(
        defaultOtros.representanteRol,
        config.otros.representanteRol,
      ) as ElementConfigWithLineSpacing,
      { withLineSpacing: true },
    ) as ElementConfigWithLineSpacing,
    footer: normalizeElementConfig({
      ...defaultOtros.footer,
      ...config.otros.footer,
    }) as ElementConfig,
  };

  return { ...config, otros: mergedOtros };
}
