/**
 * Construye el valor de la cabecera Content-Disposition (RFC 6266 / 5987).
 * Incluye `filename` ASCII de respaldo y `filename*` UTF-8 para clientes modernos.
 */
export function buildAttachmentContentDisposition(filename: string): string {
  const safeAscii = filename
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encoded}`;
}
