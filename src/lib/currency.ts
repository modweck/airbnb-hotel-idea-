/**
 * Format a number as a USD price string.
 *
 * Default: rounds to nearest dollar ("$1,234").
 * Pass `{ cents: true }` to keep cents ("$1,234.56").
 */
export function formatMoney(
  amount: number,
  options: { cents?: boolean; currency?: string } = {},
): string {
  if (!Number.isFinite(amount)) return "—";

  const { cents = false, currency = "USD" } = options;
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}
