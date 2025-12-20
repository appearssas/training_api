/**
 * Helper para generar códigos de estudiante automáticos
 * Formato: EST{YYYY}{NNNNN}
 * Ejemplo: EST2025001, EST2025002, etc.
 */

/**
 * Genera un código de estudiante único basado en el año actual y un número secuencial
 * @param ultimoNumero - El último número secuencial usado (opcional)
 * @returns Código de estudiante en formato EST{YYYY}{NNNNN}
 */
export function generarCodigoEstudiante(ultimoNumero?: number): string {
  const año = new Date().getFullYear();
  const numero = ultimoNumero ? ultimoNumero + 1 : 1;
  
  // Formato: EST + año (4 dígitos) + número secuencial (5 dígitos con ceros a la izquierda)
  // Ejemplo: EST20250001, EST20250002, etc.
  const numeroFormateado = numero.toString().padStart(5, '0');
  
  return `EST${año}${numeroFormateado}`;
}

/**
 * Extrae el número secuencial de un código de estudiante existente
 * @param codigo - Código de estudiante en formato EST{YYYY}{NNNNN}
 * @returns Número secuencial o null si el formato no es válido
 */
export function extraerNumeroSecuencial(codigo: string): number | null {
  // Validar formato: EST seguido de 4 dígitos (año) y 5 dígitos (número)
  const regex = /^EST(\d{4})(\d{5})$/;
  const match = codigo.match(regex);
  
  if (!match) {
    return null;
  }
  
  return parseInt(match[2], 10);
}

/**
 * Valida si un código de estudiante tiene el formato correcto
 * @param codigo - Código a validar
 * @returns true si el formato es válido
 */
export function validarFormatoCodigoEstudiante(codigo: string): boolean {
  const regex = /^EST\d{9}$/; // EST + 4 dígitos (año) + 5 dígitos (número)
  return regex.test(codigo);
}

