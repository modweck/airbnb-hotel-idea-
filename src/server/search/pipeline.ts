import { getListingProvider } from "@/lib/listing-provider";
import { geocodePlace, distanceMiles } from "@/lib/geocode";
import { findNightlifeHotspots, applyVibeToListings } from "@/lib/vibe";
import { applyBudgetFilter, type BudgetInput } from "@/lib/budget";
import type { Listing } from "@/lib/types";

export interface SearchTripInput {
  location: string;
  checkIn: string;
  checkOut: string;
  groupSize: number;
  pairs: number;
  stayType: "houses" | "hotels" | "both";
  minBeds?: number;
  minBathrooms?: number;
  budgetMin?: number;
  budgetMax?: number;
  budgetMode: "total" | "per_person";
  vibes: string[];
  distanceTo?: string;
}

export interface SearchTripMeta {
  providerName: string;
  rawCount: number;
  matchedCount: number;
  overflowCount: number;
  hasRequiredParams: boolean;
  needsLiveQuery: boolean;
}

export interface SearchTripResult {
  matched: Listing[];
  overflow: Listing[];
  meta: SearchTripMeta;
}

// User-facing vibe slug → internal vibe tag. Kept in sync with results/page.tsx.
const VIBE_SLUG_TO_TAG: Record<string, string> = {
  lively: "lively",
  chill: "moderate",
  adventure: "quiet",
};

/**
 * Run the full trip-search pipeline:
 *   provider.fetch → geocode/distance enrichment → vibe tagging → vibe filter →
 *   budget filter (matched/overflow split).
 *
 * Lifted verbatim from src/app/results/page.tsx so both the /api/search HTTP
 * route and Next Server Components can share one code path.
 *
 * Throws on provider errors — callers decide whether to render or 500.
 */
export async function searchTrip(
  input: SearchTripInput,
): Promise<SearchTripResult> {
  const provider = getListingProvider();
  const needsLiveQuery = provider.name !== "seed";
  const hasRequiredParams =
    !needsLiveQuery || (!!input.location && !!input.checkIn && !!input.checkOut);

  let listings: Listing[] = [];

  if (hasRequiredParams) {
    listings = await provider.fetch({
      location: input.location,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      groupSize: input.groupSize,
      pairs: input.pairs,
      stayType: input.stayType,
      minBedrooms: input.minBeds,
      minBathrooms: input.minBathrooms,
    });
  }

  const rawCount = listings.length;

  if (input.distanceTo && listings.length > 0) {
    const target = await geocodePlace(input.distanceTo);
    if (target) {
      for (const l of listings) {
        if (l.location.lat != null && l.location.lng != null) {
          l.distanceMi =
            Math.round(
              distanceMiles(target, {
                lat: l.location.lat,
                lng: l.location.lng,
              }) * 10,
            ) / 10;
          l.distanceTo = input.distanceTo;
        }
      }
    }
  }

  if (input.location && listings.length > 0) {
    const hotspots = await findNightlifeHotspots(input.location);
    applyVibeToListings(listings, hotspots);
  }

  const selectedVibe =
    input.vibes.length > 0 ? VIBE_SLUG_TO_TAG[input.vibes[0]] : null;
  if (selectedVibe) {
    listings = listings.filter((l) => l.vibeTag === selectedVibe);
  }

  const budgetInput: BudgetInput = {
    budgetMin: input.budgetMin,
    budgetMax: input.budgetMax,
    budgetMode: input.budgetMode,
  };
  const { matched, overflow } = applyBudgetFilter(
    listings,
    budgetInput,
    input.groupSize,
  );

  return {
    matched,
    overflow,
    meta: {
      providerName: provider.name,
      rawCount,
      matchedCount: matched.length,
      overflowCount: overflow.length,
      hasRequiredParams,
      needsLiveQuery,
    },
  };
}
