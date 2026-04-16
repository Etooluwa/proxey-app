/**
 * Currency utilities shared across server-side charge paths.
 */

const PLATFORM_CURRENCY = "cad";

/**
 * Safely resolve a lowercase ISO 4217 currency code from a booking, service,
 * or any object that may carry a `currency` field.
 *
 * - Returns `source.currency.toLowerCase()` when present.
 * - Logs a console.warn and returns PLATFORM_CURRENCY when the field is
 *   missing or falsy — so a missing currency never silently charges in the
 *   wrong denomination, but also never hard-crashes a payment path.
 *
 * @param {object|null|undefined} source  Any object with an optional `currency` property.
 * @param {string} [context]              Label used in the warning message (e.g. 'charge-card').
 * @returns {string}  Lowercase currency code, e.g. 'cad', 'usd', 'gbp'.
 */
export function resolveChargeCurrency(source, context = "") {
  const cur = source?.currency;
  if (!cur) {
    console.warn(
      `[currency] missing currency${context ? " in " + context : ""}, falling back to ${PLATFORM_CURRENCY}`
    );
    return PLATFORM_CURRENCY;
  }
  return cur.toLowerCase();
}

export { PLATFORM_CURRENCY };
