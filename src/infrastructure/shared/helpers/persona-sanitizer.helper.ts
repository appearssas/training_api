import { Persona } from '@/entities/persona/persona.entity';

/**
 * Sanitiza los datos personales: todos los string en mayúsculas (trim + toUpperCase).
 * fotoUrl solo se recorta (las URLs son case-sensitive).
 *
 * @param personaData - Datos parciales de la persona a sanitizar
 * @returns Datos sanitizados con strings en mayúsculas
 */
export function sanitizePersonaData(
  personaData: Partial<Persona>,
): Partial<Persona> {
  const sanitized = { ...personaData };

  if (typeof sanitized.numeroDocumento === 'string') {
    sanitized.numeroDocumento = sanitized.numeroDocumento.trim().toUpperCase();
  }
  if (typeof sanitized.tipoDocumento === 'string') {
    sanitized.tipoDocumento = sanitized.tipoDocumento.trim().toUpperCase();
  }
  if (typeof sanitized.tipoPersona === 'string') {
    sanitized.tipoPersona = sanitized.tipoPersona.trim().toUpperCase() as
      | 'NATURAL'
      | 'JURIDICA';
  }
  if (typeof sanitized.nombres === 'string') {
    sanitized.nombres = sanitized.nombres.trim().toUpperCase();
  }
  if (typeof sanitized.apellidos === 'string') {
    sanitized.apellidos = sanitized.apellidos.trim().toUpperCase();
  }
  if (typeof sanitized.email === 'string') {
    sanitized.email = sanitized.email.trim().toUpperCase();
  }
  if (typeof sanitized.telefono === 'string') {
    sanitized.telefono = sanitized.telefono.trim().toUpperCase();
  }
  if (typeof sanitized.direccion === 'string') {
    sanitized.direccion = sanitized.direccion.trim().toUpperCase();
  }
  if (typeof sanitized.biografia === 'string') {
    sanitized.biografia = sanitized.biografia.trim().toUpperCase();
  }
  if (typeof sanitized.fotoUrl === 'string') {
    sanitized.fotoUrl = sanitized.fotoUrl.trim();
  }

  return sanitized;
}
