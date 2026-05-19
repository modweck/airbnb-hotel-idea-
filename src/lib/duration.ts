/**
 * Calculate the number of nights between two dates.
 *
 * @example
 *   nightsBetween("2026-05-19", "2026-05-22") // 3
 *   nightsBetween("2026-05-19", "2026-05-19") // 0
 *   nightsBetween("2026-12-31", "2027-01-02") // 2
 *
 * Returns 0 for invalid or reversed date ranges.
 * YYYY-MM-DD strings are parsed as UTC midnight so DST shifts in the
 * local timezone don't add/subtract a phantom night.
 */
export function nightsBetween(
  checkIn: string | Date,
  checkOut: string | Date,
): number {
  const start = parseDate(checkIn);
  const end = parseDate(checkOut);
  if (!start || !end) return 0;

  const ms = end.getTime() - start.getTime();
  if (ms <= 0) return 0;

  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function parseDate(input: string | Date): Date | null {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const d = new Date(
      Date.UTC(
        parseInt(match[1], 10),
        parseInt(match[2], 10) - 1,
        parseInt(match[3], 10),
      ),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}
