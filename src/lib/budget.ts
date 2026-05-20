import type { Listing } from "@/lib/types";

export interface BudgetInput {
  budgetMin?: number;
  budgetMax?: number;
  budgetMode?: "total" | "per_person";
}

export interface NormalizedBudget {
  totalMin: number | undefined;
  totalMax: number | undefined;
  perPersonMax: number | undefined;
}

// Overflow ceiling = max * 1.15. Expressed as integer ratio (115/100) to avoid
// IEEE 754 quirks like 800 * 1.15 = 919.9999... that would exclude a $920 listing.
const OVERFLOW_NUM = 115;
const OVERFLOW_DEN = 100;

/**
 * Convert a per-person or total budget value into a total-stay number.
 * Returns `undefined` when per-person math requires group size we don't have.
 */
function toTotal(
  value: number,
  budgetMode: "total" | "per_person" | undefined,
  groupSize: number,
): number | undefined {
  if (budgetMode === "per_person") {
    return groupSize > 0 ? value * groupSize : undefined;
  }
  return value;
}

export function normalizeBudget(
  input: BudgetInput,
  groupSize: number,
): NormalizedBudget {
  const { budgetMin, budgetMax, budgetMode } = input;

  if (budgetMax === undefined && budgetMin === undefined) {
    return { totalMin: undefined, totalMax: undefined, perPersonMax: undefined };
  }

  const totalMin =
    budgetMin !== undefined ? toTotal(budgetMin, budgetMode, groupSize) : undefined;
  const totalMax =
    budgetMax !== undefined ? toTotal(budgetMax, budgetMode, groupSize) : undefined;

  let perPersonMax: number | undefined;
  if (budgetMax !== undefined) {
    if (budgetMode === "per_person") {
      perPersonMax = budgetMax;
    } else if (groupSize > 0) {
      perPersonMax = budgetMax / groupSize;
    }
  }

  return { totalMin, totalMax, perPersonMax };
}

export type BudgetVerdict = "match" | "overflow" | "exclude";

export function listingMatchesBudget(
  listing: Listing,
  input: BudgetInput,
  groupSize: number,
): BudgetVerdict {
  const { totalMin, totalMax } = normalizeBudget(input, groupSize);
  const cost = listing.pricing.totalForStay;

  // Below the floor → excluded outright (no overflow grace for being too cheap).
  if (totalMin !== undefined && cost < totalMin) return "exclude";

  if (totalMax === undefined) return "match";
  if (cost <= totalMax) return "match";
  if (cost * OVERFLOW_DEN <= totalMax * OVERFLOW_NUM) return "overflow";
  return "exclude";
}

export interface FilterResult {
  matched: Listing[];
  overflow: Listing[];
}

export function applyBudgetFilter(
  listings: Listing[],
  input: BudgetInput,
  groupSize: number,
): FilterResult {
  const { totalMin, totalMax } = normalizeBudget(input, groupSize);
  const sortByCost = (a: Listing, b: Listing) =>
    a.pricing.totalForStay - b.pricing.totalForStay;

  // No bounds at all → return everything sorted.
  if (totalMin === undefined && totalMax === undefined) {
    return { matched: [...listings].sort(sortByCost), overflow: [] };
  }

  // totalMin enforcement happens per-listing inside listingMatchesBudget below.
  const matched: Listing[] = [];
  const candidateOverflow: Listing[] = [];

  for (const l of listings) {
    const verdict = listingMatchesBudget(l, input, groupSize);
    if (verdict === "match") matched.push(l);
    else if (verdict === "overflow") candidateOverflow.push(l);
  }

  matched.sort(sortByCost);

  if (matched.length >= 3) {
    return { matched, overflow: [] };
  }

  candidateOverflow.sort(sortByCost);
  return { matched, overflow: candidateOverflow };
}
