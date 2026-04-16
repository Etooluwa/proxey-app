/**
 * Shared money formatting utility.
 * All price display in the app should go through these functions.
 * In Stage 5, replace the hardcoded 'cad' arguments with actual booking/service currency values.
 */

export function formatMoney(cents, currency = 'cad') {
  if (cents == null) return '';
  const dollars = Number(cents) / 100;
  const code = (currency || 'cad').toUpperCase();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: dollars % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function formatMoneyFromDollars(dollars, currency = 'cad') {
  return formatMoney(Math.round(Number(dollars) * 100), currency);
}
