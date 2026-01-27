/**
 * Sanitiza los datos de empresa: todos los string en mayúsculas (trim + toUpperCase).
 *
 * @param data - Datos parciales de empresa (CreateEmpresaDto, UpdateEmpresaDto o similar)
 * @returns Objeto con los campos string sanitizados (solo se tocan los string; el resto se mantiene)
 */
export function sanitizeEmpresaData<T extends object>(data: T): T {
  const o = { ...data } as Record<string, unknown>;

  if (typeof o.numeroDocumento === 'string') {
    o.numeroDocumento = o.numeroDocumento.trim().toUpperCase();
  }
  if (typeof o.tipoDocumento === 'string') {
    o.tipoDocumento = o.tipoDocumento.trim().toUpperCase();
  }
  if (typeof o.razonSocial === 'string') {
    o.razonSocial = o.razonSocial.trim().toUpperCase();
  }
  if (typeof o.email === 'string') {
    o.email = o.email.trim().toUpperCase();
  }
  if (typeof o.telefono === 'string') {
    o.telefono = o.telefono.trim().toUpperCase();
  }
  if (typeof o.direccion === 'string') {
    o.direccion = o.direccion.trim().toUpperCase();
  }

  return o as T;
}
