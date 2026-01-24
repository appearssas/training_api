import { jsPDF } from 'jspdf';
import {
	ElementConfig,
	ElementConfigWithLineSpacing,
	CertificateTypeFlags,
} from '../types/pdf-config.interface';
import { DEFAULT_VALUES } from '../constants/pdf.constants';
import { getElementConfig } from './config-helpers.utils';
import type { PdfConfig } from '../types/pdf-config.interface';

/**
 * Aplica estilos de texto al documento PDF
 */
function applyTextStyle(
	doc: jsPDF,
	fontSize: number,
	color: [number, number, number],
	bold: boolean,
): void {
	doc.setFontSize(fontSize);
	doc.setTextColor(...color);
	doc.setFont('helvetica', bold ? 'bold' : 'normal');
}

/**
 * Renderiza texto con alineación condicional
 */
function renderText(
	doc: jsPDF,
	text: string,
	x: number,
	y: number,
	pageWidth: number,
): void {
	const isCentered = x === pageWidth / 2;
	if (isCentered) {
		doc.text(text, x, y, { align: 'center' });
	} else {
		doc.text(text, x, y);
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
	const cursoX = config?.x !== undefined ? config.x : pageWidth / 2;
	const cursoY = config?.y !== undefined ? config.y : 395;
	const cursoFontSize =
		config?.fontSize !== undefined
			? config.fontSize
			: DEFAULT_VALUES.FONT_SIZES.LARGE;
	const cursoColor =
		config?.color ??
		(isSimplified
			? DEFAULT_VALUES.COLORS.WHITE
			: DEFAULT_VALUES.COLORS.BLUE_DARK);
	const cursoBold = config?.bold !== undefined ? config.bold : true;

	applyTextStyle(doc, cursoFontSize, cursoColor, cursoBold);
	renderText(doc, cursoNombre, cursoX, cursoY, pageWidth);
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
	const nombreX = config?.x !== undefined ? config.x : pageWidth / 2;
	const nombreY = config?.y !== undefined ? config.y : 290;
	const nombreFontSize =
		config?.fontSize !== undefined
			? config.fontSize
			: DEFAULT_VALUES.FONT_SIZES.LARGE;
	const nombreColor = config?.color ?? DEFAULT_VALUES.COLORS.BLUE_DARK;
	const nombreBold = config?.bold !== undefined ? config.bold : true;

	applyTextStyle(doc, nombreFontSize, nombreColor, nombreBold);
	renderText(doc, nombreCompleto, nombreX, nombreY, pageWidth);
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

	applyTextStyle(doc, docFontSize, docColor, docBold);
	renderText(doc, documento, docX, docY, pageWidth);
}

/**
 * Renderiza el nombre de una persona (instructor o representante)
 */
export function renderPersonName(
	doc: jsPDF,
	pageWidth: number,
	name: string,
	config: ElementConfig | undefined,
	defaultX: number,
	defaultY: number,
	defaultFontSize: number,
): void {
	const nombreX = config?.x !== undefined ? config.x : defaultX;
	const nombreY = config?.y !== undefined ? config.y : defaultY;
	const nombreFontSize =
		config?.fontSize !== undefined ? config.fontSize : defaultFontSize;
	const nombreColor =
		config?.color ?? DEFAULT_VALUES.COLORS.BLUE_DARK;
	const nombreBold = config?.bold !== undefined ? config.bold : true;

	applyTextStyle(doc, nombreFontSize, nombreColor, nombreBold);
	renderText(doc, name, nombreX, nombreY, pageWidth);
}

/**
 * Renderiza un rol con soporte para múltiples líneas
 */
export function renderRole(
	doc: jsPDF,
	pageWidth: number,
	roleText: string,
	config: ElementConfig | ElementConfigWithLineSpacing | undefined,
	defaultX: number,
	defaultY: number,
	defaultFontSize: number,
	lineSpacing: number = DEFAULT_VALUES.LINE_SPACING.INSTRUCTOR_ROLE,
): void {
	const rolX = config?.x !== undefined ? config.x : defaultX;
	const rolY = config?.y !== undefined ? config.y : defaultY;
	const rolFontSize =
		config?.fontSize !== undefined ? config.fontSize : defaultFontSize;
	const rolColor = config?.color ?? DEFAULT_VALUES.COLORS.BLUE_DARK;
	const rolBold = config?.bold !== undefined ? config.bold : false;
	const rolLineSpacing: number =
		(config as ElementConfigWithLineSpacing)?.lineSpacing !== undefined
			? (config as ElementConfigWithLineSpacing).lineSpacing!
			: lineSpacing;

	applyTextStyle(doc, rolFontSize, rolColor, rolBold);

	const roleLines = roleText.split('\n');
	roleLines.forEach((line: string, index: number) => {
		const yPos = rolY + index * rolLineSpacing;
		renderText(doc, line, rolX, yPos, pageWidth);
	});
}
