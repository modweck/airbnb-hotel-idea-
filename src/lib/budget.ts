import type { Listing } from "@/lib/types";

export interface BudgetInput {
  budgetMin?: number;
  budgetMax?: number;
  budgetMode?: "total" | "per_person";
}

export interface NormalizedBudget {
  totalMax: number | undefined;
  perPersonMax: number | undefined;
}

// Overflow ceiling = max * 1.15. Expressed as integer ratio (115/100) to avoid
// IEEE 754 quirks like 800 * 1.15 = 919.9999... that would exclude a $920 listing.
const OVERFLOW_NUM = 115;
const OVERFLOW_DEN = 100;

export function normalizeBudget(
  input: BudgetInput,
  groupSize: number,
): NormalizedBudget {
  const { budgetMax, budgetMode } = input;

  if (budgetMax === undefined) {
    return { totalMax: undefined, perPersonMax: undefined };
  }

  if (budgetMode === "per_person") {
    return {
      perPersonMax: budgetMax,
      totalMax: groupSize > 0 ? budgetMax * groupSize : undefined,
    };
  }

  return {
    totalMax: budgetMax,
    perPersonMax: groupSize > 0 ? budgetMax / groupSize : undefined,
  };
}

export type BudgetVerdict = "match" | "overflow" | "exclude";

export function listingMatchesBudget(
  listing: Listing,
  input: BudgetInput,
  groupSize: number,
): BudgetVerdict {
  const { totalMax } = normalizeBudget(input, groupSize);
  if (totalMax === undefined) return "match";

  const cost = listing.pricing.totalForStay;
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
  const { totalMax } = normalizeBudget(input, groupSize);
  const sortByCost = (a: Listing, b: Listing) =>
    a.pricing.totalForStay - b.pricing.totalForStay;

  if (totalMax === undefined) {
    return { matched: [...listings].sort(sortByCost), overflow: [] };
  }

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
