/**
 * Formatea un número al estilo argentino (puntos para miles, coma para decimales)
 * Ejemplo: 1000000.50 -> "1.000.000,50"
 */
export function formatArgentineNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }

  // Separar parte entera y decimal
  const parts = value.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';

  // Agregar puntos cada 3 dígitos desde la derecha
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Si hay decimales, agregar coma
  if (decimalPart) {
    return `${formattedInteger},${decimalPart}`;
  }

  return formattedInteger;
}

/**
 * Parsea un número del formato argentino (puntos para miles, coma para decimales)
 * Ejemplo: "1.000.000,50" -> 1000000.50
 */
export function parseArgentineNumber(value: string): number | null {
  if (!value || value.trim() === '') {
    return null;
  }

  // Remover puntos (separadores de miles) y reemplazar coma por punto
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Formatea un monto en pesos argentinos
 */
export function formatPesos(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '$ 0';
  }

  return `$ ${formatArgentineNumber(value)}`;
}

