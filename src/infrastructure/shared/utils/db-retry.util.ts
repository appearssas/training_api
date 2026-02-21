/**
 * Utilidad para detectar errores transitorios de conexión a la base de datos
 * (ECONNRESET, ETIMEDOUT, etc.) y calcular tiempos de espera para reintentos.
 */

export const TRANSIENT_DB_CODES = [
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
] as const;

interface ExceptionLike {
  message?: string;
  driverError?: { code?: string };
}

/**
 * Indica si el error es transitorio (conexión cerrada/reset, timeouts, etc.)
 * y tiene sentido reintentar la operación.
 */
export function isTransientDbError(exception: unknown): boolean {
  if (exception == null) return false;
  const e = exception as ExceptionLike;
  const msg = String(e?.message ?? '');
  if (TRANSIENT_DB_CODES.some(c => msg.includes(c))) return true;
  const code = e?.driverError?.code;
  return (
    typeof code === 'string' &&
    TRANSIENT_DB_CODES.includes(code as (typeof TRANSIENT_DB_CODES)[number])
  );
}

/** Número de intentos totales (incluye el primero) */
export const DB_RETRY_MAX_ATTEMPTS = 5;

/** Espera base en ms para el backoff exponencial */
export const DB_RETRY_BASE_MS = 400;

/** Tope en ms por espera entre intentos */
export const DB_RETRY_CAP_MS = 5000;

/**
 * Calcula la espera en ms antes del reintento (backoff exponencial con cap).
 * attempt: 0 = primer reintento, 1 = segundo, etc.
 */
export function getDbRetryDelayMs(attempt: number): number {
  const ms = DB_RETRY_BASE_MS * Math.pow(2, attempt);
  return Math.min(ms, DB_RETRY_CAP_MS);
}
