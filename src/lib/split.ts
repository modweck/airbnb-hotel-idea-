/**
 * Split a total cost evenly across a group, returning the per-person share.
 *
 * @example
 *   splitPerPerson(1600, 8)  // 200
 *   splitPerPerson(100, 3)   // 33.33
 *   splitPerPerson(500, 0)   // 0  (guard against divide-by-zero)
 *
 * Result is rounded to two decimal places (cents). Callers that need a
 * cleaner display should pipe through `formatMoney`.
 */
export function splitPerPerson(total: number, people: number): number {
  if (!Number.isFinite(total) || !Number.isFinite(people)) return 0;
  if (people <= 0) return 0;
  return Math.round((total / people) * 100) / 100;
}
