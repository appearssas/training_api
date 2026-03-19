import { Usuario } from '@/entities/usuarios/usuario.entity';

export const USUARIO_EXPORT_HEADERS = [
  'Nombre',
  'Email',
  'Documento',
  'Tipo documento',
  'Usuario',
  'Rol',
  'Tipo persona',
  'Estado',
  'Empresa',
  'Último acceso',
  'Fecha creación',
] as const;

export function formatUsuarioExportDate(
  d: Date | string | null | undefined,
): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

export function csvEscapeCell(
  value: string | number | boolean | Date | null | undefined,
): string {
  if (value === null || value === undefined) return '""';
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

/** Fila de exportación única (CSV / Excel) — mantener alineado con el contrato del endpoint. */
export function usuarioToExportRow(u: Usuario): (string | number)[] {
  const p = u.persona;
  const nombres = p?.nombres ?? '';
  const apellidos = p?.apellidos ?? '';
  const nombre = `${nombres} ${apellidos}`.trim() || nombres || 'Sin nombre';
  const tipoDoc = (p?.tipoDocumento ?? '').toUpperCase();
  const tipoPersona = tipoDoc === 'NIT' ? 'Jurídica' : 'Natural';
  const empresa = p?.empresa?.razonSocial ?? '';

  return [
    nombre,
    p?.email ?? '',
    p?.numeroDocumento ?? '',
    p?.tipoDocumento ?? '',
    u.username ?? '',
    u.rolPrincipal?.nombre ?? u.rolPrincipal?.codigo ?? '',
    tipoPersona,
    u.habilitado ? 'Habilitado' : 'Deshabilitado',
    empresa,
    formatUsuarioExportDate(u.ultimoAcceso),
    formatUsuarioExportDate(u.fechaCreacion),
  ];
}
