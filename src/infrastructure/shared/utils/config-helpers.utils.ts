import {
	PdfConfig,
	ElementConfig,
	ImageConfig,
	CertificateConfig,
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
