import { Persona } from '@/entities/persona/persona.entity';

/**
 * Sanitiza los datos personales de una persona convirtiendo a mayúsculas
 * los campos de texto que deben almacenarse en mayúsculas.
 * 
 * Campos que se sanitizan:
 * - nombres: Convertido a mayúsculas
 * - apellidos: Convertido a mayúsculas
 * - razonSocial: Convertido a mayúsculas (si existe)
 * - direccion: Convertido a mayúsculas (si existe)
 * 
 * Campos que NO se sanitizan:
 * - email: Se mantiene en minúsculas (se normaliza por separado)
 * - numeroDocumento: Se mantiene tal cual
 * - telefono: Se mantiene tal cual
 * 
 * @param personaData - Datos parciales de la persona a sanitizar
 * @returns Datos sanitizados con campos en mayúsculas
 */
export function sanitizePersonaData(
  personaData: Partial<Persona>,
): Partial<Persona> {
  const sanitized = { ...personaData };

  // Sanitizar nombres
  if (sanitized.nombres && typeof sanitized.nombres === 'string') {
    sanitized.nombres = sanitized.nombres.trim().toUpperCase();
  }

  // Sanitizar apellidos
  if (sanitized.apellidos && typeof sanitized.apellidos === 'string') {
    sanitized.apellidos = sanitized.apellidos.trim().toUpperCase();
  }

  // Sanitizar razón social
  if (sanitized.razonSocial && typeof sanitized.razonSocial === 'string') {
    sanitized.razonSocial = sanitized.razonSocial.trim().toUpperCase();
  }

  // Sanitizar dirección
  if (sanitized.direccion && typeof sanitized.direccion === 'string') {
    sanitized.direccion = sanitized.direccion.trim().toUpperCase();
  }

  // Normalizar email a minúsculas (si existe)
  if (sanitized.email && typeof sanitized.email === 'string') {
    sanitized.email = sanitized.email.trim().toLowerCase();
  }

  return sanitized;
}

