import { Certificado } from '@/entities/certificados/certificado.entity';

export const CERTIFICADO_EXPORT_HEADERS = [
  'ID',
  'Numero certificado',
  'Curso',
  'Estudiante',
  'Documento',
  'Estado',
  'Fecha emision',
  'Fecha vencimiento',
  'Codigo verificacion',
] as const;

export function csvEscapeCell(
  value: string | number | boolean | Date | null | undefined,
): string {
  if (value === null || value === undefined) return '""';
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function getEstado(cert: Certificado): string {
  if (!cert.activo) return 'Revocado';
  const now = new Date();
  if (cert.fechaVencimiento && new Date(cert.fechaVencimiento) < now) {
    return 'Vencido';
  }
  return 'Valido';
}

export function certificadoToExportRow(cert: Certificado): (string | number)[] {
  const estudiante = cert.inscripcion?.estudiante;
  const curso = cert.inscripcion?.capacitacion;
  const nombre =
    `${estudiante?.nombres ?? ''} ${estudiante?.apellidos ?? ''}`.trim() || '';

  return [
    cert.id,
    cert.numeroCertificado ?? '',
    curso?.titulo ?? '',
    nombre,
    estudiante?.numeroDocumento ?? '',
    getEstado(cert),
    formatDate(cert.fechaEmision),
    formatDate(cert.fechaVencimiento),
    cert.hashVerificacion ?? '',
  ];
}
