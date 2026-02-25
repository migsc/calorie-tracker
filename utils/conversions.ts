/**
 * Convert pounds to kilograms.
 */
export function lbToKg(lb: number): number {
  return Math.round(lb * 0.45359237 * 10) / 10;
}

/**
 * Convert kilograms to pounds.
 */
export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462262 * 10) / 10;
}

/**
 * Format weight value with unit label.
 */
export function formatWeight(weight: number, unit: 'lb' | 'kg'): string {
  return `${weight} ${unit}`;
}

/**
 * Parse a weight string to a number; returns null if invalid.
 */
export function parseWeight(str: string): number | null {
  const n = parseFloat(str);
  if (isNaN(n) || n <= 0) return null;
  return Math.round(n * 10) / 10;
}
