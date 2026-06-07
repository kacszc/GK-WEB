/**
 * Format an amount (in major units, e.g. złoty/euro) in the given ISO 4217 currency.
 * Backend stores minor units + currency; the UI formats per locale via Intl.
 */
export function formatMoney(amount: number, currency = "PLN", locale = "pl-PL"): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    // Unknown currency code → plain number + code.
    return `${amount.toFixed(2)} ${currency}`;
  }
}
