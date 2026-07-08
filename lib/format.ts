/**
 * Formats a number as a localized currency string
 * Always uses es-CL locale to ensure consistent server/client rendering
 */
export function formatCurrencyNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  return num.toLocaleString('es-CL')
}

/**
 * Formats a number with currency symbol
 */
export function formatCurrency(value: number | string, symbol: string = '$'): string {
  return `${symbol}${formatCurrencyNumber(value)}`
}
