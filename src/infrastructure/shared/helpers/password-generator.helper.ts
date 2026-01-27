/**
 * Helper para generar contraseñas temporales seguras
 */

/**
 * Genera una contraseña temporal segura
 * Formato: [PREFIJO][CARACTERES_ALEATORIOS]
 * Ejemplo: TEMP_A3b7K9m2P5q
 * 
 * @param length - Longitud de la contraseña (default: 12)
 * @param prefix - Prefijo opcional para la contraseña (default: 'TEMP_')
 * @returns Contraseña temporal generada
 */
export function generarPasswordTemporal(
  length: number = 12,
  prefix: string = 'TEMP_',
): string {
  // Caracteres permitidos: mayúsculas, minúsculas, números y algunos símbolos
  const caracteres =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  
  // Asegurar que tenga al menos una mayúscula, una minúscula, un número y un símbolo
  const mayuscula = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const minuscula = 'abcdefghijklmnopqrstuvwxyz';
  const numeros = '0123456789';
  const simbolos = '!@#$%&*';

  let password = prefix;

  // Agregar al menos un carácter de cada tipo
  password +=
    mayuscula[Math.floor(Math.random() * mayuscula.length)] +
    minuscula[Math.floor(Math.random() * minuscula.length)] +
    numeros[Math.floor(Math.random() * numeros.length)] +
    simbolos[Math.floor(Math.random() * simbolos.length)];

  // Completar el resto con caracteres aleatorios
  const caracteresRestantes = length - password.length;
  for (let i = 0; i < caracteresRestantes; i++) {
    password += caracteres[Math.floor(Math.random() * caracteres.length)];
  }

  // Mezclar los caracteres para que no sea predecible
  return (
    prefix +
    password
      .slice(prefix.length)
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('')
  );
}

/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * @param password - Contraseña a validar
 * @returns true si cumple los requisitos
 */
export function validarPasswordSegura(password: string): boolean {
  // Mínimo 8 caracteres
  if (password.length < 8) {
    return false;
  }

  // Debe tener al menos una mayúscula
  if (!/[A-Z]/.test(password)) {
    return false;
  }

  // Debe tener al menos una minúscula
  if (!/[a-z]/.test(password)) {
    return false;
  }

  // Debe tener al menos un número
  if (!/[0-9]/.test(password)) {
    return false;
  }

  // Debe tener al menos un carácter especial
  if (!/[!@#$%&*]/.test(password)) {
    return false;
  }

  return true;
}

