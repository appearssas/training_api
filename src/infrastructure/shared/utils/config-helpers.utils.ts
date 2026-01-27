import {
	PdfConfig,
	ElementConfig,
	ImageConfig,
	CertificateConfig,
	CertificateConfigOtros,
	CertificateTypeFlags,
} from '../types/pdf-config.interface';

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
	return certificateConfig?.[imageKey] as ImageConfig | undefined;
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
		if (
			usarConfigSustancias &&
			conditionalDefaults.sustancias !== undefined
		) {
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

	// Fusionar cada propiedad de config.otros con los valores por defecto
	const mergedOtros: CertificateConfigOtros = {
		...defaultOtros,
		...config.otros,
		// Fusionar propiedades anidadas
		cursoNombre: { ...defaultOtros.cursoNombre, ...config.otros.cursoNombre },
		nombreEstudiante: {
			...defaultOtros.nombreEstudiante,
			...config.otros.nombreEstudiante,
		},
		documento: { ...defaultOtros.documento, ...config.otros.documento },
		duracion: { ...defaultOtros.duracion, ...config.otros.duracion },
		fechaEmision: {
			...defaultOtros.fechaEmision,
			...config.otros.fechaEmision,
		},
		fechaVencimiento: {
			...defaultOtros.fechaVencimiento,
			...config.otros.fechaVencimiento,
		},
		qr: { ...defaultOtros.qr, ...config.otros.qr },
		instructorFirma: {
			...defaultOtros.instructorFirma,
			...config.otros.instructorFirma,
		},
		instructorNombre: {
			...defaultOtros.instructorNombre,
			...config.otros.instructorNombre,
		},
		instructorRol: {
			...defaultOtros.instructorRol,
			...config.otros.instructorRol,
		},
		representanteFirma: {
			...defaultOtros.representanteFirma,
			...config.otros.representanteFirma,
		},
		representanteNombre: {
			...defaultOtros.representanteNombre,
			...config.otros.representanteNombre,
		},
		representanteRol: {
			...defaultOtros.representanteRol,
			...config.otros.representanteRol,
		},
		footer: { ...defaultOtros.footer, ...config.otros.footer },
	};

	return { ...config, otros: mergedOtros };
}
